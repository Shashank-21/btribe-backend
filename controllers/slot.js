import Slot from "../models/slot.js";

export const createSlot = async (request, response) => {
  try {
    console.log(request.user._id);
    const { date, time } = request.body;
    const dateTime = new Date(`${date}T${time}`);
    const slot = await new Slot({
      mentor: request.user._id,
      dateTime,
      studentId: "",
      waitList: [],
    }).save();
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
    const { slotId } = request.params;
    const slot = await Slot.findByIdAndUpdate(
      slotId,
      {
        student: request.user._id,
      },
      { new: true }
    );
    console.log(slot);
    response.json(slot);
  } catch (error) {
    console.log(error);
    return response.status(400).json(error);
  }
};
export const joinSlotWaitlist = async (request, response) => {
  try {
    const { slotId } = request.params;
    const slot = await Slot.findById(slotId);
    const waitList = [...slot.waitList, request.user._id];

    await slot.updateOne({ waitList }, { new: true });

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
    const removed = await Slot.findByIdAndDelete(slotId);

    response.json(removed);
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
    console.log(error);
    return response.status(400).json(error);
  }
};
