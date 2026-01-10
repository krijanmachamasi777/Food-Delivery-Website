import moogoose from "mongoose";

const userSchema = new moogoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    cartData: {
        type: Object,
        default: {},
    },
    
  },
  {
    minimize: false,
  }
);
const userModel = moogoose.model.user || moogoose.model("user", userSchema);

export default userModel;
