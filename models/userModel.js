const crypto = require('crypto')
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please tell us your name!'],
    },
    email: {
      type: String,
      required: [true, 'Please tell us your email!'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    avatar: String,
    role: {
      type: String,
      enum: ['user', 'admin', 'demo'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please provide a password'],
      validate: {
        // * Only work on CREATE and SAVE
        validator: function (el) {
          return el === this.password
        },
        message: 'Password are not the same!',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    validatedEmail: {
      type: Boolean,
      default: false,
    },
    validateEmailToken: String,
    validateEmailExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    // contacts: [{ type: mongoose.Schema.ObjectId, ref: 'User', select: false }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
)

userSchema.virtual('files', {
  ref: 'File',
  foreignField: 'userUpload',
  localField: '_id',
})

userSchema.virtual('verifies', {
  ref: 'Verify',
  foreignField: 'user',
  localField: '_id',
})

userSchema.pre('save', async function (next) {
  // * Only run this function if password was actually modified
  if (!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)

  this.passwordConfirm = undefined
  next()
})

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = Date.now() - 1000
  next()
})

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } })

  next()
})

userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    )
    return JWTTimestamp < changedTimestamp
  }

  return false
}

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000

  // Send this token to user mail that forgot password then parse it to reset token with createHash in resetPassword api to compare with passwordResetToken in DB
  return resetToken
}

userSchema.methods.createValidateEmailToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.validateEmailToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.validateEmailExpires = Date.now() + 24 * 60 * 60 * 1000

  return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User
