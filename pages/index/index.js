// index.js
// 获取应用实例
import * as posenet from '@tensorflow-models/posenet';
import {detectPoseInRealTime, drawPoses} from '../../posenet/posenet';

const CANVAS_ID = 'image';
const POSENET_URL = 'https://www.gstaticcnapps.cn/tfjs-models/savedmodel/posenet/mobilenet/float/050/model-stride16.json';
//'/posenet/model-stride16.json'


const app = getApp()

Page({
  data: {result: ''},
  posenetModel: undefined,
  canvas: undefined,
  poses: undefined,
  ctx: undefined,
  posenet() {
    if (this.posenetModel == null) {
      this.setData({result: 'loading posenet model...'});
      posenet
          .load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: 193,
            multiplier: 0.5,
            modelUrl: POSENET_URL
          })
          .then((model) => {
            this.posenetModel = model;
            this.setData({result: 'model loaded.'});
          });
    }
  },
  executePosenet(frame) {
    if (this.posenetModel) {
      const start = Date.now();
      detectPoseInRealTime(frame, this.posenetModel, false)
          .then((poses) => {
            this.poses = poses;
            drawPoses(this);
            const result = `${Date.now() - start}ms`;
            this.setData({result});
          })
          .catch((err) => {
            console.log(err, err.stack);
          });
    }
  },
  async onReady() {
    console.log('create canvas context for #image...');
    setTimeout(() => {
      this.ctx = wx.createCanvasContext(CANVAS_ID);
      console.log('ctx', this.ctx);
    }, 500);

    this.posenet();

    // Start the camera API to feed the captured images to the models.
    // @ts-ignore the ts definition for this method is worng.
    const context = wx.createCameraContext(this);
    let count = 0;
    const listener = (context).onCameraFrame((frame) => {
      console.log('******onCameraFrame',count,frame)
      count++;
      if (count === 3) {//3 frame一传
        this.executePosenet(frame);
        count = 0;
      }
    });
    listener.start();
  },
  onUnload() {
    if (this.posenetModel) {
      this.posenetModel.dispose();
    }
  }
})


