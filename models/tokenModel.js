const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30,
      unique: false,
    },
    privateKey: { type: String, required: true },
    publicKey: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

const Token = mongoose.model('Token', tokenSchema)

module.exports = Token
