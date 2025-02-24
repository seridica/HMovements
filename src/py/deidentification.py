from cv2 import cv2 as cv
import numpy as np
import sys
import os
from queue import Queue
import subprocess

haarcascadePath = os.path.join(os.getcwd(), 'haarcascade', 'haarcascade_frontalface_alt.xml')
ffmpeg_path = os.path.join(os.getcwd(), "ffmpeg\\")

faceCascade = cv.CascadeClassifier(haarcascadePath)
xOffSetPercentage = 0.05
yOffSetPercentage = 0.2
videoPath = sys.argv[1]
skeletonPath = sys.argv[2]
savePath = sys.argv[3]

def applyGaussianBlur(image, dimension):

    def findNearestOdd(value):
        if value % 2 == 0:
            return value - 1
        else:
            return value

    imageWithBlur = image.copy()
    (x, y, w, h) = dimension
    y1 = int(y - y * yOffSetPercentage)
    y2 = int(y + h + y * yOffSetPercentage)
    x1 = int(x - x * xOffSetPercentage)
    x2 = int(x + w + x * xOffSetPercentage)
    subFace = image[y1:y2, x1:x2]
    kSizeW = findNearestOdd(w // 2)
    kSizeH = findNearestOdd(h // 2)
    subFace = cv.GaussianBlur(subFace, (kSizeW, kSizeH), 0)
    imageWithBlur[y1:y2, x1:x2] = subFace
    return imageWithBlur


def init():
    cap = cv.VideoCapture(videoPath)
    faceLocations = []
    while cap.isOpened():
        ret, frame = cap.read()
        if ret == True:
            gray = cv.cvtColor(frame, cv.COLOR_BGR2GRAY)
            faces = faceCascade.detectMultiScale(gray, 1.1, 5)
            faceLocations.append(faces)
        else:
            break

    cap.release()
    writeVideo(videoPath, faceLocations, 'blurred.avi')
    writeVideo(skeletonPath, faceLocations, 'blurred_skeleton.avi')
    aviVideos = ['blurred', 'blurred_skeleton']
    convertVideos(aviVideos)
    cv.destroyAllWindows()

def filterThreshold(locations, filterPercentage, medianWidth, medianHeight):
    if filterPercentage > 0.5:
        return locations
    widthOffset = medianWidth * filterPercentage
    heightOffset = medianHeight * filterPercentage
    tmp = []
    for loc in locations:
        x, y, w, h = loc
        if w < medianWidth + widthOffset and w > medianWidth - widthOffset and h < medianHeight + heightOffset and h > medianHeight - heightOffset:
            tmp.append(loc)
    
    if len(tmp) == 0:
        tmp = filterThreshold(locations, filterPercentage + 0.1, medianWidth, medianHeight)
    return tmp

def estimateArea(beforeFrame, afterFrame, medianFaceSize, frameNum, totalMissingFrames):
    width, height = medianFaceSize

    filterPercentage = 0.1
    beforeFaceLocation = filterThreshold(beforeFrame, filterPercentage, width, height)
    afterFaceLocation = filterThreshold(afterFrame, filterPercentage, width, height)

    def findFacePair(facesBefore, facesAfter):

        for dim1 in facesBefore:
            x1, y1, w1, h1 = dim1
            for dim2 in facesAfter:
                x2, y2, w2, h2 = dim2
                if abs(x1 - x2) < width and abs(y1 - y2) < height:
                    return (dim1, dim2)
        return None

    facePair = None
    if len(beforeFaceLocation) > 1 or len(afterFaceLocation) > 1:
        facePair = findFacePair(beforeFaceLocation, afterFaceLocation)

    def avgFaceLocation(faceBefore, faceAfter):

        def interpolate(a1, a2, y1, y2, x):
            return y1 + (y2 - y1) / (a2 - a1) * (x - a1) 

        x1, y1, w1, h1 = faceBefore
        x2, y2, w2, h2 = faceAfter
        newX = interpolate(0, totalMissingFrames + 1, x1, x2, frameNum)
        newY = interpolate(0, totalMissingFrames + 1, y1, y2, frameNum)
        newW = max(w1, w2)
        newH = max(h1, h2)
        return (newX, newY, newW, newH)

    if facePair is not None:
        return [avgFaceLocation(facePair[0], facePair[1])]


    return afterFaceLocation

def findMedian(faceLocations):
    wArray = []
    hArray = []
    for loc in faceLocations:
        if type(loc) is not tuple:
            for (x, y, w, h) in loc:
                wArray.append(w)
                hArray.append(h)
    return np.median(wArray), np.median(hArray)




def convertVideos(videos):
    os.chdir(ffmpeg_path)
    for video in videos:
        subprocess.run([r'bin\ffmpeg.exe', '-i', fr'{savePath}\{video}.avi', fr'{savePath}\{video}.mp4'])

def writeVideo(path, faceLocations, videoName):
    cap = cv.VideoCapture(path)
    frameWidth = int(cap.get(3))
    frameHeight = int(cap.get(4))

    medianFaceSize = findMedian(faceLocations)
    fourcc = cv.VideoWriter_fourcc(*'MJPG')
    out = cv.VideoWriter(os.path.join(savePath, videoName), fourcc, 30, (frameWidth,frameHeight))
    lastFaceLocation = None
    faceQueue = Queue()
    cur = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if ret == True:
            faces = faceLocations[cur]
            cur += 1

            if type(faces) is not tuple:
                numOfMissingFramesBetween = faceQueue.qsize()

                while faceQueue.qsize() > 0:
                    estimatedArea = faces
                    frameInQueue = faceQueue.get()

                    if lastFaceLocation is not None:
                        frameNum = numOfMissingFramesBetween - faceQueue.qsize()
                        estimatedArea = estimateArea(lastFaceLocation, faces, medianFaceSize, frameNum, numOfMissingFramesBetween) 

                    for dimension in estimatedArea:
                        frameInQueue = applyGaussianBlur(frameInQueue, dimension)

                    out.write(frameInQueue)

                lastFaceLocation = faces
                filteredFaceLocation = filterThreshold(faces, 0.1, medianFaceSize[0], medianFaceSize[1])
                for dimension in filteredFaceLocation:
                    frame = applyGaussianBlur(frame, dimension)
                out.write(frame)
            else:
                faceQueue.put(frame)

        else:
            break

    while faceQueue.qsize() > 0 and lastFaceLocation is not None:
        frame = faceQueue.get()
        frame = applyGaussianBlur(frame, lastFaceLocation)
        out.write(frame)

    out.release()
    cap.release()


init()