import { model, Schema } from "mongoose";

interface Town {
  name: string;
  mayor: string;
  depMayor: string;
  coords: string;
  rank: string;
}

const townSchema = new Schema<Town>({
  name: String,
  mayor: String,
  depMayor: { type: String, required: false, default: "None" },
  coords: String,
  rank: { type: String, required: false, default: "Unranked" },
});

let name = "Town";
if (process.env.DEV) {
  name += "DEV";
}

export default model<Town>(name, townSchema);
