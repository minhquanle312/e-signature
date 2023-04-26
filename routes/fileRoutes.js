const express = require('express')
const fileController = require('./../controllers/fileController')
const authController = require('./../controllers/authController')

const router = express.Router()

router.use(authController.protect)

router.post(
  '/',
  fileController.uploadSingle,
  fileController.uploadFile,
  fileController.createFile
)

module.exports = router
