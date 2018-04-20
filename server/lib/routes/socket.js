const cv = require('opencv4nodejs');
const axios = require('axios');

const instance = axios.create({
    baseURL: `http://18.233.162.100/api/`,
    timeout: 5000
});
const drawRect = (image, rect, color, opts = { thickness: 2 }) =>
    image.drawRectangle(
        rect,
        color,
        opts.thickness,
        cv.LINE_8
    );

const drawBlueRect = (image, rect, opts = { thickness: 2 }) =>
    drawRect(image, rect, new cv.Vec(255, 0, 0), opts);

const grabFrames = (videoFile, delay, onFrame) => {
    const cap = new cv.VideoCapture(videoFile);
    let done = false;
    const intvl = setInterval(() => {
        let frame = cap.read();
        // loop back to start on end of stream reached
        if (frame.empty) {
            cap.reset();
            frame = cap.read();
        }
        onFrame(frame);

        const key = cv.waitKey(delay);
        done = key !== -1 && key !== 255;
        if (done) {
            clearInterval(intvl);
            console.log('Key pressed, exiting.');
        }
    }, 0);
};

const runVideoFaceDetection = (src, detectFaces) => grabFrames(src, 1, async (frame) => {
    console.time('detection time');
    const frameResized = frame.resizeToMax(800);

    // detect faces
    const faceRects = detectFaces(frameResized);
    if (faceRects.length) {
        // draw detection
        faceRects.forEach(faceRect => drawBlueRect(frameResized, faceRect));
        cv.imshow('face detection', frameResized);
        console.log('faceDetected>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
        const event = 'face_detected';
        await instance.get('/webcam', { event });

    }
    cv.imshow('face detection', frameResized);
    console.timeEnd('detection time');
});

module.exports = function (socket) {
    const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

    const webcamPort = 0;

    function detectFaces(img) {
        // restrict minSize and scaleFactor for faster processing
        const options = {
            minSize: new cv.Size(100, 100),
            scaleFactor: 1.2,
            minNeighbors: 10
        };
        return classifier.detectMultiScale(img.bgrToGray(), options).objects;
    }
    console.log('emitting data');
    const faceDetected = runVideoFaceDetection(webcamPort, detectFaces);
    socket.emit('face_detected', { data: faceDetected});
};
