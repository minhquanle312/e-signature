const multer = require('multer')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { initializeApp } = require('firebase/app')
const {
  getStorage,
  ref,
  getDownloadURL,
  getBytes,
  uploadBytesResumable,
} = require('firebase/storage')
const File = require('./../models/fileModel')
const firebaseConfig = require('../configs/firebase')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

initializeApp(firebaseConfig)

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage()

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() })

exports.uploadSingle = upload.single('filename')

exports.downloadFile = catchAsync(async (req, res, next) => {
  if (!req.body.url) return next()

  const httpsReference = ref(storage, req.body.url)
  try {
    const arrayBuffer = await getBytes(httpsReference)
    // console.log(arrayBuffer)
    // const sign = crypto.createSign('RSA-SHA256')
    // sign.write(arrayBuffer)
    // sign.end()

    // const signature = sign.sign(process.env.JWT_SECRET, 'base64')

    //   const hashedToken = crypto
    // .createHash('sha256')
    // .update(req.params.token)
    // .digest('hex')

    const token = jwt.sign(
      { arrayBuffer, id: req.user.id },
      process.env.JWT_SECRET
      // { algorithm: 'RS256' }
    )

    req.token = token
  } catch (error) {
    req.token = null
  }

  next()
})

exports.generateToken = catchAsync(async (req, res, next) => {
  req.body.signatureToken = req.token
  // res.status(201).json({ status: 'success', token: req.token })
  next()
})

exports.uploadFile = catchAsync(async (req, res, next) => {
  const dateTime = new Date().getTime()

  try {
    const storageRef = ref(
      storage,
      `files/${req.file.originalname + '_' + dateTime}`
    )

    // Create file metadata including the content type
    const metadata = {
      contentType: req.file.mimetype,
    }

    // Upload the file in the bucket storage
    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    )
    //by using uploadBytesResumable we can control the progress of uploading like pause, resume, cancel

    // Grab the public url
    const downloadURL = await getDownloadURL(snapshot.ref)

    req.body.name = req.file.originalname
    req.body.type = req.file.mimetype
    req.body.url = downloadURL
    req.body.userUpload = req.user.id
  } catch (error) {
    req.body.name = null
    req.body.type = null
    req.body.url = null
    req.body.userUpload = null
  }

  next()
})

exports.createFile = factory.createOne(File)
exports.updateFile = factory.updateOne(File)
