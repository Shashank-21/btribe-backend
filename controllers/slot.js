import Slot from "../models/slot.js";
import { calendar, getClient } from "./google.js";
import { v4 as uuid } from "uuid";
import User from "../models/user.js";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export function timeDisplay(timeString) {
  const [hourString, minuteString] = timeString.split(":");
  const hours = parseInt(hourString);
  let ampm = "";
  let hoursReturn = 0;
  if (hours === 0) {
    hoursReturn = 12;
    ampm = "AM";
  } else if (hours === 12) {
    hoursReturn = 12;
    ampm = "PM";
  } else if (hours < 12) {
    hoursReturn = hours;
    ampm = "AM";
  } else {
    hoursReturn = hours % 12;
    ampm = "PM";
  }
  return `${hoursReturn}:${minuteString} ${ampm}`;
}

export const createSlot = async (request, response) => {
  try {
    const { date, time } = request.body;
    const dateTime = new Date(`${date}T${time}`);
    const timeRef = dateTime.getTime();
    const existingSlot = await Slot.findOne({
      mentor: request.user._id,
      timeRef,
    });
    if (existingSlot) {
      console.log("existing:", existingSlot);
      return response.status(400).json({
        error: `Slot exists for the given mentor at ${date} on ${time}`,
      });
    }
    const slot = await new Slot({
      mentor: request.user._id,
      dateTime,
      timeRef,
      student: "",
      waitList: [],
      purposeWaitList: [],
    }).save();
    console.log(slot);
    response.json(slot);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};

export const listSlotsByMentor = async (request, response) => {
  try {
    const { mentorId: mentor } = request.params;
    const all = await Slot.find({ mentor }).populate(["mentor", "student"]);
    const allSlots = all.map((slot) => {
      return {
        ...slot,
        date: slot.dateTime.toISOString().substring(0, 10),
        time: slot.dateTime.toTimeString().substring(0, 5),
      };
    });
    response.json(allSlots);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const listSlotsByStudent = async (request, response) => {
  try {
    const { studentId: student } = request.params;
    const slots = await Slot.find({ student }).populate(["mentor", "student"]);
    const allSlots = await Slot.find({}).populate(["mentor", "student"]);
    const waitListSlots = allSlots.filter((slot) => {
      return slot.waitList.includes(student);
    });
    response.json({ slots, waitListSlots });
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const bookSlot = async (request, response) => {
  try {
    const { purpose } = request.body;
    const { slotId } = request.params;
    const student = await User.findById(request.user._id);
    const slot = await Slot.findById(slotId).populate("mentor");
    if (!purpose) {
      return response
        .status(400)
        .json({ error: "You need to tell why you're booking the slot." });
    } else if (!student) {
      return response.status(400).json({ error: "Student not found" });
    } else if (!slot) {
      return response.status(400).json({ error: "Slot not found" });
    }

    const authClientMentor = getClient(process.env.REDIRECT_URI_MENTOR);
    authClientMentor.setCredentials(slot.mentor.credentials);
    //send event with creator as mentor, attendees - mentor and student. Start - Slot time. End, slot time plus half an hour. Add conference details (Meet link)
    const calendarInvite = await calendar.events.insert({
      calendarId: "primary",
      auth: authClientMentor,
      sendUpdates: "all",
      conferenceDataVersion: 1,
      requestBody: {
        summary: `${slot.mentor.name} - ${student.name}, one-to-one slot`,
        description: `${student.name}'s purpose for booking the slot: \n ${purpose}`,
        start: {
          dateTime: new Date(slot.timeRef).toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: new Date(slot.timeRef + 30 * 60 * 1000).toISOString(),
          timeZone: "Asia/Kolkata",
        },
        conferenceData: {
          createRequest: { requestId: uuid() },
        },
        creator: {
          email: "admin@btribe.co.in",
          self: false,
        },

        attendees: [
          {
            email: student.email,
            organizer: false,
            responseStatus: "accepted",
          },
          {
            email: slot.mentor.email,
            organizer: true,
            responseStatus: "accepted",
          },
        ],
      },
    });

    await slot.updateOne(
      {
        student: request.user._id,
        status: "booked",
        purpose,
        eventDetails: calendarInvite.data,
      },
      { new: true }
    );

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: [slot.mentor.email, student.email],
      Subject: `Slot booked. Date: ${new Date(
        slot.timeRef
      ).toLocaleDateString()}. Time: ${timeDisplay(
        new Date(slot.timeRef).toTimeString()
      )} `,
      html: `
      <p>Mentor: ${slot.mentor.name}</p>
      <p>Student: ${student.name}</p>
      <p>Purpose: ${purpose}</p>
      <br/>
      <p>Joining Link: <a href=${calendarInvite.data.hangoutLink} target="_blank">${calendarInvite.data.hangoutLink}</p>
      `,
    };

    try {
      sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }

    response.json(slot);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};

export const joinSlotWaitlist = async (request, response) => {
  try {
    const { slotId } = request.params;
    const { purpose } = request.body;
    if (!purpose) {
      return response
        .status(400)
        .json({ error: "You need to tell why you're booking the slot." });
    }
    const slot = await Slot.findById(slotId).populate("mentor");
    const waitList = [...slot.waitList, request.user._id];
    const purposeWaitList = [...slot.purposeWaitList, purpose];
    await slot.updateOne({ waitList, purposeWaitList }, { new: true });

    const student = await User.findById(request.user._id);

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: student.email,
      Subject: `You're in the waitlist!`,
      html: `
       <p>Date: ${new Date(slot.timeRef).toLocaleDateString()}.</p> 
       <p>Time:${timeDisplay(new Date(slot.timeRef).toTimeString())} </p>
      <p>Mentor: ${slot.mentor.name}</p>
      <p>Purpose: ${purpose}</p>
      <br/>
      `,
    };

    try {
      sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }

    response.json(slot);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};

export const deleteSlot = async (request, response) => {
  try {
    const { slotId } = request.params;
    console.log(slotId);
    const { mentorCancellationReason } = request.body;
    const slot = await Slot.findById(slotId).populate("mentor");
    console.log(slot);
    if (slot.eventDetails) {
      const authClientMentor = getClient(process.env.REDIRECT_URI_MENTOR);
      authClientMentor.setCredentials(slot.mentor.credentials);
      await calendar.events.delete({
        calendarId: "primary",
        auth: authClientMentor,
        sendUpdates: "all",
        eventId: slot.eventDetails.id,
      });
    }

    await slot.updateOne(
      {
        purpose: "",
        waitList: null,
        purposeWaitList: null,
        eventDetails: null,
        mentorCancellationReason,
        status: "cancelled by mentor",
      },
      { new: true }
    );

    //Email to student - slot cancelled by mentor.
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: [slot.mentor.email, student.email],
      Subject: `Slot on ${new Date(
        slot.timeRef
      ).toLocaleDateString()} at ${timeDisplay(
        new Date(slot.timeRef).toTimeString()
      )} is cancelled by the mentor`,
      html: `<p>Dear ${student.name}, we regret to inform that the slot you have booked is cancelled by ${slot.mentor.name}. Thank you for understanding.</p>`,
    };

    try {
      sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }

    response.json(slot);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};

export const listAllSlots = async (request, response) => {
  try {
    const all = await Slot.find({}).populate(["mentor", "student"]);

    const allSlots = all.map((slot) => {
      return {
        ...slot._doc,
        date: slot.dateTime.toISOString().substring(0, 10),
        time: slot.dateTime.toTimeString().substring(0, 5),
      };
    });
    response.json(allSlots);
  } catch (error) {
    return response.status(400).json(error);
  }
};

export const updateSlotStatus = async (request, response) => {
  try {
    const { status } = request.body;
    const { slotId } = request.params;

    const slot = await Slot.findByIdAndUpdate(
      slotId,
      { status },
      { new: true }
    );
    const slotDetails = {
      ...slot._doc,
      date: slot.dateTime.toISOString().substring(0, 10),
      time: slot.dateTime.toTimeString().substring(0, 5),
    };
    response.json(slotDetails);
  } catch (error) {
    return response.status(400).json(error);
  }
};

export const updatePastSlotsStudent = async (request, response) => {
  try {
    const { student } = request.body;
    const now = new Date();
    now.setMinutes(now.getMinutes() - 30);
    const slotTimeRef = now.getTime();
    const studentSlots = await Slot.where({ student })
      .where({ status: "booked" })
      .where("timeRef")
      .lte(slotTimeRef)
      .updateMany({ status: "completed" });
    response.json({ updateStatus: "done", studentSlots });
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const updatePastSlotsMentor = async (request, response) => {
  try {
    const { mentor } = request.body;
    const now = new Date();
    now.setMinutes(now.getMinutes() - 30);
    const slotTimeRef = now.getTime();
    const mentorSlotsBooked = await Slot.where({ mentor })
      .where({ status: "booked" })
      .where("timeRef")
      .lte(slotTimeRef)
      .updateMany({ status: "completed" });
    const mentorSlotsOpen = await Slot.where({ mentor })
      .where({ status: "open" })
      .where("timeRef")
      .lte(slotTimeRef)
      .updateMany({ status: "not utilised" });
    response.json({ updateStatus: "done" });
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};

export const deleteAllSlots = async (request, response) => {
  try {
    const allSlots = await Slot.find({});
    for (let slot of allSlots) {
      await Slot.findByIdAndDelete(slot._id);
    }
    response.json({ status: "done" });
  } catch (error) {
    response.status(400).json(error);
  }
};

export const cancelSlotBookingStudent = async (request, response) => {
  try {
    const { slotId } = request.body;
    const slot = await Slot.findById(slotId).populate(["mentor", "student"]);
    const existingStudent = {
      email: slot.student.email,
      name: slot.student.name,
    };

    const authClientMentor = getClient(process.env.REDIRECT_URI_MENTOR);
    authClientMentor.setCredentials(slot.mentor.credentials);
    console.log(authClientMentor);

    if (slot.waitList.length) {
      //get Student from id
      const slotWaitList = [...slot.waitList];
      const slotPurposeWaitList = [...slot.purposeWaitList];
      const studentId = slotWaitList.shift();
      const purpose = slotPurposeWaitList.shift();
      const student = await User.findById(studentId);

      //update calendar invite
      const eventDetails = await calendar.events.update({
        calendarId: "primary",
        auth: authClientMentor,
        eventId: slot.eventDetails.id,
        requestBody: {
          summary: `${slot.mentor.name} - ${student.name}, one-to-one slot`,
          description: `${student.name}'s purpose for booking the slot: \n ${purpose}`,
          start: {
            dateTime: new Date(slot.timeRef).toISOString(),
            timeZone: "Asia/Kolkata",
          },
          end: {
            dateTime: new Date(slot.timeRef + 30 * 60 * 1000).toISOString(),
            timeZone: "Asia/Kolkata",
          },
          creator: {
            email: "admin@btribe.co.in",
            self: false,
          },
          attendees: [
            {
              email: student.email,
              organizer: false,
              responseStatus: "accepted",
            },
            {
              email: slot.mentor.email,
              organizer: true,
              responseStatus: "accepted",
            },
          ],
        },
      });

      //update slot with sutudent ID, purpose and eventDetails
      await slot
        .updateOne(
          {
            student: studentId,
            purpose,
            eventDetails,
          },
          { new: true }
        )
        .populate(["mentor", "student"]);

      //Email to new student
      const emailData = {
        from: process.env.EMAIL_FROM,
        to: [slot.mentor.email, student.email],
        Subject: `Slot booked. Date: ${new Date(
          slot.timeRef
        ).toLocaleDateString()}. Time: ${timeDisplay(
          new Date(slot.timeRef).toTimeString()
        )} `,
        html: `
      <p>Congratulations, ${student.name}, you're off the waitlist, into the slot!</p>
      <p>Mentor: ${slot.mentor.name}</p>
      <p>Student: ${student.name}</p>
      <p>Purpose: ${purpose}</p>
      <br/>
      <p>Joining Link: <a href=${calendarInvite.data.hangoutLink} target="_blank">${calendarInvite.data.hangoutLink}</p>
      `,
      };

      try {
        sgMail.send(emailData);
      } catch (error) {
        console.log(error);
      }
    } else {
      // delete calendar invite
      await calendar.events.delete({
        calendarId: "primary",
        auth: authClientMentor,
        sendUpdates: "all",
        eventId: slot.eventDetails.id,
      });

      // update the slot student, status, purpose and eventDetails
      await slot
        .updateOne(
          {
            student: null,
            purpose: "",
            status: "open",
            eventDetails: {},
          },
          { new: true }
        )
        .populate("mentor");
    }
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: [slot.mentor.email, existingStudent.email],
      Subject: `Slot on ${new Date(
        slot.timeRef
      ).toLocaleDateString()} at ${timeDisplay(
        new Date(slot.timeRef).toTimeString()
      )} cancelled by ${existingStudent.name}`,
      html: `
      <p>This slot has been cancelled by ${existingStudent.name}. If there is any student in the waitlist, the slot goes to them.</p>
      `,
    };

    try {
      sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }
    response.json(slot);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const handleFeedback = async (request, response) => {
  try {
    const provider = await User.findById(request.user._id);

    const { slotId } = request.params;
    const { rating, subjectiveFeedback } = request.body;
    let slot;
    if (provider.role === 0) {
      slot = await Slot.findByIdAndUpdate(
        slotId,
        {
          feedbackMentor: {
            rating,
            subjectiveFeedback,
            status: "sent for approval",
          },
        },
        { new: true }
      );
    } else if (provider.role === 1) {
      slot = await Slot.findByIdAndUpdate(
        slotId,
        {
          feedbackStudent: {
            rating,
            subjectiveFeedback,
            status: "sent for approval",
          },
        },
        { new: true }
      );
    }
    response.json(slot);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const handleFeedbackApproval = async (request, response) => {
  try {
    const { slotId } = request.params;
    const { mentorFeedbackVerdict, studentFeedbackVerdict } = request.body;
    const slot = await Slot.findById(slotId);

    if (mentorFeedbackVerdict === "rejected") {
      await slot.updateOne({ feedbackMentor: {} }, { new: true });
    } else if (studentFeedbackVerdict === "rejected") {
      await slot.updateOne({ feedbackStudent: {} }, { new: true });
    } else {
      if (mentorFeedbackVerdict) {
        const feedbackMentor = {
          ...slot.feedbackMentor,
          status: mentorFeedbackVerdict,
        };
        console.log(feedbackMentor);
        await slot.updateOne(
          {
            feedbackMentor,
          },
          { new: true }
        );
      }
      if (studentFeedbackVerdict) {
        const feedbackStudent = {
          ...slot.feedbackStudent,
          status: studentFeedbackVerdict,
        };
        console.log(feedbackStudent);
        await slot.updateOne(
          {
            feedbackStudent,
          },
          { new: true }
        );
      }
    }
    console.log(slot);
    response.json(slot);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const handleRefundRequest = async (request, response) => {
  try {
    const { slotId } = request.params;
    const { studentRefundReason } = request.body;
    const slot = await Slot.findByIdAndUpdate(
      slotId,
      { studentRefundReason, status: "refund requested by student" },
      { new: true }
    );
    response.json(slot);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const handleRefundRequestApproval = async (request, response) => {
  try {
    const { slotId } = request.params;
    const { status } = request.body;
    const slot = await Slot.findByIdAndUpdate(
      slotId,
      { status },
      { new: true }
    );
    response.json(slot);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};

export const dropOffWaitList = async (request, response) => {
  try {
    const { slotId } = request.params;
    const slot = await Slot.findById(slotId);
    const student = await User.findById(request.user._id);
    const { waitList, purposeWaitList } = slot;
    const studentIndex = waitList.indexOf(student._id);
    console.log(studentIndex);
    const updatedWaitList = waitList.filter(
      (item, index) => index !== studentIndex
    );
    const updatedPurposeWaitList = purposeWaitList.filter(
      (item, index) => index !== studentIndex
    );
    console.log(updatedWaitList);
    console.log(updatedPurposeWaitList);
    await slot.updateOne(
      { waitList: updatedWaitList, purposeWaitList: updatedPurposeWaitList },
      { new: true }
    );

    const emailData = {
      from: process.env.EMAIL_FROM,
      to: student.email,
      Subject: `You're off the waitlist!`,
      html: `
       <p>As per your request, we've removed you from the waitlist.</p>
      `,
    };

    try {
      sgMail.send(emailData);
    } catch (error) {
      console.log(error);
    }

    response.json(slot);
  } catch (error) {
    console.log(error);
    response.status(400).json(error);
  }
};
