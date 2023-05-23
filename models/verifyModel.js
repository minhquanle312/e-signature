const mongoose = require('mongoose')

const verifySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    publicKey: String,
    signature: String,
    verify: {
      type: String,
      enum: ['waiting', 'signature valid', 'signature invalid'],
      default: 'waiting',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

const File = mongoose.model('Verify', verifySchema)

module.exports = File
