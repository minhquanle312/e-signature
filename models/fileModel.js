const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema(
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
    userUpload: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pkiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
    },
    signatureToken: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

const File = mongoose.model('File', fileSchema)

module.exports = File
