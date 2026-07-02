import { Router } from "express";
import multer from "multer";
import { asyncHandler, badRequest } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { storageService } from "../integrations/storage.js";

export const uploadsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Apenas imagens são permitidas"));
  },
});

// POST /uploads — multipart (campo "file") -> StorageService -> { url }
uploadsRouter.post(
  "/",
  authenticate(), // qualquer sujeito autenticado (cliente, funcionário, entregador)
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest("Arquivo ausente (campo 'file')");
    const url = await storageService.upload({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ url });
  })
);
