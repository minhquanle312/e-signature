const crypto = require('crypto')
const Verify = require('./../models/verifyModel')
const Token = require('./../models/tokenModel')
const firebaseConfig = require('../configs/firebase')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
const slugify = require('slugify')
const {
  getStorage,
  ref,
  getDownloadURL,
  getBytes,
  uploadBytesResumable,
  deleteObject,
} = require('firebase/storage')

const storage = getStorage()

exports.generateKeyPair = catchAsync(async (req, res, next) => {
  // console.log(req.user)
  const { name } = req.body || {}

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'der',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der',
    },
  })

  req.body.name = name
  req.body.privateKey = privateKey.toString('base64')
  req.body.publicKey = publicKey.toString('base64')
  req.body.user = req.user.id

  next()
})

exports.signDataWithPrivateKey = catchAsync(async (req, res, next) => {
  let { data, privateKey } = req.body

  // * input privateKey is string (base64) --> so convert its to Buffer
  privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKey, 'base64'),
    type: 'pkcs8',
    format: 'der',
  })

  let sign = crypto.createSign('sha256')
  sign.update(data)
  sign.end()

  let signature = sign.sign(privateKey).toString('base64')

  res.send({ data, signature })
})

exports.verifyDataWithPublicKey = catchAsync(async (req, res, next) => {
  let { urlFile, publicKey, signature } = req.body || {}

  const httpsReference = ref(storage, urlFile)
  try {
    const arrayBuffer = await getBytes(httpsReference)

    let data = Buffer.from(arrayBuffer, 'base64')
    publicKey = crypto.createPublicKey({
      key: Buffer.from(publicKey, 'base64'),
      type: 'spki',
      format: 'der',
    })

    const verify = crypto.createVerify('sha256')
    verify.update(data)
    verify.end()

    let result = verify.verify(publicKey, Buffer.from(signature, 'base64'))

    res.status(200).json({ verify: result })
  } catch (error) {
    console.log(error)
    // req.body.data = null
    return next(new AppError('Something went wrong', 500))
  }
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

    const metadata = {
      contentType: req.file.mimetype,
    }

    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    )

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
    console.log(error)
    return next(new AppError('Something went wrong', 400))
  }
})

exports.createToken = factory.createOne(Token)
exports.getAllTokens = factory.getAll(Token)
exports.createVerifyFile = factory.createOne(Verify)
exports.updateVerifyFile = factory.updateOne(Verify)
