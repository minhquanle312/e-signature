// const multer = require('multer')
const AppError = require('../utils/appError')
const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const factory = require('./handlerFactory')
const cloudinary = require('../utils/cloudinary')

// const multerStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, 'public/img/users')
//   },
//   filename: (req, file, callback) => {
//     // user-:userId-:date
//     // user-12343452-345353324.jpeg
//     const ext = file.mimetype.split('/')[1]
//     callback(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   },
// })

// const multerFilter = (req, file, callback) => {
//   if (file.mimetype.startsWith('image')) {
//     callback(null, true)
//   } else {
//     callback(
//       new AppError('Not an image! Please upload only images.', 400),
//       false
//     )
//   }
// }

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter,
// })

// exports.uploadUserPhoto = upload.single('photo')

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })

  return newObj
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id
  next()
}

exports.addNewContact = catchAsync(async (req, res, next) => {
  if (req.user.email === req.body.userEmail) {
    return next(new AppError('Can not add yourself to your contacts', 404))
  }

  const contactsIdList = req.user.contacts.map(contact => contact.id)
  const contactInfo = await User.findOne({ email: req.body.userEmail })

  if (!contactInfo) {
    return next(new AppError('No user found with this email', 404))
  }

  const isInUserContact = contactsIdList.includes(contactInfo.id)

  if (isInUserContact) {
    return next(new AppError('This user is in your contacts', 404))
  }

  req.body.contacts = [...contactsIdList, contactInfo.id]

  next()
})

exports.uploadUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.body.avatar) return next()

  try {
    const result = await cloudinary.uploader.upload(req.body.avatar, {
      folder: 'quick-chat',
    })

    req.body.avatar = result.secure_url
  } catch (error) {
    req.body.avatar = null
  }

  next()
})

exports.updateMe = catchAsync(async (req, res, next) => {
  // * 1. Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    )
  }

  // * 2. Update user document
  const filteredBody = filterObj(req.body, 'name', 'email', 'contacts')
  // if (req.file) filteredBody.photo = req.file.filename

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser },
  })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false })

  res.status(204).json({
    status: 'success',
    data: null,
  })
})

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not define! Please use sign up instead',
  })
}

exports.getUser = factory.getOne(User, {
  path: 'files',
  select: '-__v',
})
// exports.getUser = factory.getOne(User)
exports.getAllUsers = factory.getAll(User)

// * Do NOT update password with this
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)
