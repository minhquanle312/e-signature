const multer = require('multer')
const jwt = require('jsonwebtoken')
const { initializeApp } = require('firebase/app')
const {
  getStorage,
  ref,
  getDownloadURL,
  getBytes,
  uploadBytesResumable,
  deleteObject,
} = require('firebase/storage')
const File = require('./../models/fileModel')
const firebaseConfig = require('../configs/firebase')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')
const slugify = require('slugify')
const AppError = require('../utils/appError')
const crypto = require('crypto')

initializeApp(firebaseConfig)

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage()

// Setting up multer as a middleware to grab photo uploads
const upload = multer({ storage: multer.memoryStorage() })

exports.uploadSingle = upload.single('filename')

exports.downloadFile = catchAsync(async (req, res, next) => {
  let { privateKey } = req.body
  if (!req.params.id) return next()
  const file = await File.findById(req.params.id)

  if (!file) {
    return next(new Error('Not found file with id', 404))
  }

  const httpsReference = ref(storage, file.url)
  try {
    const arrayBuffer = await getBytes(httpsReference)

    // req.body.data = arrayBuffer
    let data = Buffer.from(arrayBuffer, 'base64')
    privateKey = crypto.createPrivateKey({
      key: Buffer.from(privateKey, 'base64'),
      type: 'pkcs8',
      format: 'der',
    })

    let sign = crypto.createSign('sha256')
    sign.update(data)
    sign.end()

    let signature = sign.sign(privateKey).toString('base64')

    res.status(200).json({ data, signature })
  } catch (error) {
    console.log(error)
    // req.body.data = null
  }

  // next()
})

exports.generateToken = catchAsync(async (req, res, next) => {
  req.body.signatureToken = req.token
  // res.status(201).json({ status: 'success', token: req.token })
  next()
})

exports.uploadFile = catchAsync(async (req, res, next) => {
  const dateTime = new Date().getTime()
  const fileNameSimplify = slugify(req.file.originalname)
  const fileNameWithoutExtension = fileNameSimplify.slice(
    0,
    fileNameSimplify.lastIndexOf('.')
  )
  const extension = fileNameSimplify.split('.').pop()
  const fileName = `${fileNameWithoutExtension}_${dateTime}.${extension}`

  try {
    const storageRef = ref(storage, `files/${fileName}`)

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

    req.body.name = fileName
    req.body.type = req.file.mimetype
    req.body.url = downloadURL
    req.body.user = req.user.id
    next()
  } catch (error) {
    req.body.name = null
    req.body.type = null
    req.body.url = null
    req.body.user = null
    return next(new AppError('Something went wrong', 400))
  }
})

exports.deleteFile = catchAsync(async (req, res, next) => {
  const { fileName } = req.body || {}

  const desertRef = ref(storage, `files/${fileName}`)

  try {
    await deleteObject(desertRef)
    res.send({ success: true })
  } catch (error) {
    return next(new AppError('Something went wrong', 4000))
  }
})

exports.createFile = factory.createOne(File)
exports.updateFile = factory.updateOne(File)
