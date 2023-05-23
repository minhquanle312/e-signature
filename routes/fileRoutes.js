const express = require('express')
const fileController = require('./../controllers/fileController')
const authController = require('./../controllers/authController')

const router = express.Router()

router.use(authController.protect)

// router.patch(
//   '/generateToken/:id',
//   fileController.downloadFile,
//   fileController.generateToken,
//   fileController.updateFile
// )

router.patch('/:id', fileController.updateFile)

router.post(
  '/',
  fileController.uploadSingle,
  fileController.uploadFile,
  fileController.createFile
)

router.delete('/', fileController.deleteFile)

module.exports = router
