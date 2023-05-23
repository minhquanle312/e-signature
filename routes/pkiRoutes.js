const express = require('express')
const fileController = require('../controllers/fileController')
const tokenController = require('../controllers/tokenController')
const authController = require('../controllers/authController')

const router = express.Router()

router.use(authController.protect)

// * test pki
router.post(
  '/generate-key-pair',
  tokenController.generateKeyPair,
  tokenController.createToken
)

router.post(
  '/sign/:id',
  fileController.downloadFile
  // tokenController.signDataWithPrivateKey
)

router.post('/verify', tokenController.verifyDataWithPublicKey)

router.patch('/:id', tokenController.updateVerifyFile)

router.post(
  '/',
  fileController.uploadSingle,
  tokenController.uploadFile,
  tokenController.createVerifyFile
)
router.get('/', tokenController.getAllTokens)

module.exports = router
