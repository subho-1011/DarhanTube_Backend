import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tmpPath = process.env === "production" ? "/tmp" : "./tmp";
        cb(null, tmpPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix);
    },
});

export const upload = multer({ storage: storage });
