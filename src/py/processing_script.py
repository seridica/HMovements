# -*- coding: utf-8 -*-
"""
Created on Mon May  4 16:42:10 2020

@author: Calvin
"""

import os
import sys
import json
import math
import subprocess
from feature_functions import *
from scipy import signal
import matplotlib.pyplot as plt
from save_functions import *

"""
Code for running OpenPose
"""

# set dir for Openpose:
# op_path = 'D:/UBC/Vigilance/OpenPose/openpose-CPU/' # ex: ~\Openpose
op_path = os.path.join(os.getcwd(), "openpose\\")
op_path_cpu = os.path.join(os.getcwd(), "openpose_cpu\\")
ffmpeg_path = os.path.join(os.getcwd(), "ffmpeg\\")


# set parameter to save keypoint

video_path = sys.argv[1]
save_path = sys.argv[2]
should_run_openpose = sys.argv[3]

# Default thresholds - Taken from Bu's code
# head_thresh = 0.14
# arm_thresh = 0.19
# leg_thresh = 0.97
# feet_thresh = 0.36

head_thresh = float(sys.argv[4])
arm_thresh = float(sys.argv[5])
leg_thresh = float(sys.argv[6])
feet_thresh = float(sys.argv[7])
video_name = 'skeleton'

# Go to top level open pose directory
if should_run_openpose >= '1':
    if should_run_openpose == '1':
        os.chdir(op_path_cpu)
    else:
        os.chdir(op_path)
    subprocess.run([r'bin\OpenPoseDemo.exe', '--video', video_path, '--write_json', fr'{save_path}\json', '--write_video', fr'{save_path}\{video_name}.avi', '--display', '0'])
    os.chdir(ffmpeg_path)
    subprocess.run([r'bin\ffmpeg.exe', '-i', fr'{save_path}\{video_name}.avi', fr'{save_path}\{video_name}.mp4'])

os.chdir(ffmpeg_path)
video_duration = subprocess.run(['bin\\ffprobe.exe', '-i', video_path, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=%s' %("p=0")], stdout=subprocess.PIPE, text=True).stdout
video_duration = float(video_duration.split('\n')[0])
# set parameter for timestamp of video, in minute
epoch_length = float(sys.argv[8])
start_t = 0.0 # ex: enter 10.5 for 10:30
end_t = math.floor(video_duration/epoch_length) * epoch_length / 60
"""
Code for post-processing json outputs
This is adapted from Bu's jupyter notebook code:
Newest_version.ipynb
"""
# First extract raw data from the json files
json_data = open_SCIT_json( save_path + '\json\\' )

# Compute the max displacements (as defined in the paper) for each of the 25 track points
max_disp_array = []
for i in range(25):
    max_disp_array.append(extract_max_vector_length(i, json_data, start_t, end_t))
max_disp_data = np.array(max_disp_array)

# Compute the normalization factor (neck to torso)
norm_factor = compute_nor(json_data, start_t, end_t)
    
# Aggregate 25 track points into the body segments and normalize - I THINK THIS NEEDS TO BE ROBUSTIFIED
head_DL = np.sum(max_disp_data[[0,15,16,17,18],:], axis=0) / norm_factor / 5
larm_DL = np.sum(max_disp_data[[2,3,4],:], axis=0) / norm_factor / 3
rarm_DL = np.sum(max_disp_data[[5,6,7],:], axis=0) / norm_factor / 3
lleg_DL = np.sum(max_disp_data[[10,11],:], axis=0) / norm_factor / 2
rleg_DL = np.sum(max_disp_data[[13,14],:], axis=0) / norm_factor / 2
lfeet_DL = np.sum(max_disp_data[[21,20,19],:], axis=0) / norm_factor / 3
rfeet_DL = np.sum(max_disp_data[[24,23,22],:], axis=0) / norm_factor / 3

# Filter aggregated data
# NOTE, THESE FILTERED SIGNALS ARE THE CONTINUOUS MOTION THAT CAN BE PLOTTED
b, a = signal.butter(3, 0.02)
head_DL_filt = signal.filtfilt(b, a, head_DL)
larm_DL_filt = signal.filtfilt(b, a, larm_DL)
rarm_DL_filt = signal.filtfilt(b, a, rarm_DL)
lleg_DL_filt = signal.filtfilt(b, a, lleg_DL)
rleg_DL_filt = signal.filtfilt(b, a, rleg_DL)
lfeet_DL_filt = signal.filtfilt(b, a, lfeet_DL)
rfeet_DL_filt = signal.filtfilt(b, a, rfeet_DL)

# Pull the max displacement in each epoch - THESE PRODUCE THE TIMELINES FOR EACH BODY SEGMENT
(epoch_t, head_DL_epoch ) = epoch_threshold(head_DL_filt, epoch_length, head_thresh, start_t, end_t)
(epoch_t, larm_DL_epoch ) = epoch_threshold(larm_DL_filt, epoch_length, arm_thresh, start_t, end_t)
(epoch_t, rarm_DL_epoch )= epoch_threshold(rarm_DL_filt, epoch_length, arm_thresh, start_t, end_t)
(epoch_t, lleg_DL_epoch ) = epoch_threshold(lleg_DL_filt, epoch_length, leg_thresh, start_t, end_t)
(epoch_t, rleg_DL_epoch ) = epoch_threshold(rleg_DL_filt, epoch_length, leg_thresh, start_t, end_t)
(epoch_t, lfeet_DL_epoch ) = epoch_threshold(lfeet_DL_filt, epoch_length, feet_thresh, start_t, end_t)
(epoch_t, rfeet_DL_epoch ) = epoch_threshold(rfeet_DL_filt, epoch_length, feet_thresh, start_t, end_t)

return_obj = {
    "motion": {
        "Head": head_DL_filt.tolist(),
        "LeftArm": larm_DL_filt.tolist(),
        "RightArm": rarm_DL_filt.tolist(),
        "LeftLeg": lleg_DL_filt.tolist(),
        "RightLeg": rleg_DL_filt.tolist(),
        "LeftFoot": lfeet_DL_filt.tolist(),
        "RightFoot": rfeet_DL_filt.tolist(),
    },
    "epoch": {
        "Head": head_DL_epoch.tolist(),
        "LeftArm": larm_DL_epoch.tolist(),
        "RightArm": rarm_DL_epoch.tolist(),
        "LeftLeg": lleg_DL_epoch.tolist(),
        "RightLeg": rleg_DL_epoch.tolist(),
        "LeftFoot": lfeet_DL_epoch.tolist(),
        "RightFoot": rfeet_DL_epoch.tolist(),
    }
}
print(json.dumps(return_obj))


# SAVING STUFF
# SAVES BOTH AS A SERIALIZED PYTHON FILE AS WELL AS 2 CSV FILES
# First CSV file contains the segment motions (*_*_filt)
# Second CSV file contains the epoch results
# Python file contains the above CSV file inforamtion as well as the raw max_disp_data
np.savez(save_path + '\\analysis.npz', max_disp_data=max_disp_data, head_DL_filt=head_DL_filt,
         larm_DL_filt=larm_DL_filt, rarm_DL_filt=rarm_DL_filt, lleg_DL_filt=lleg_DL_filt,
         rleg_DL_filt=rleg_DL_filt, lfeet_DL_filt=lfeet_DL_filt, rfeet_DL_filt=rfeet_DL_filt,
         head_DL_epoch=head_DL_epoch, larm_DL_epoch=larm_DL_epoch, rarm_DL_epoch=rarm_DL_epoch,
         lleg_DL_epoch=lleg_DL_epoch, rleg_DL_epoch=rleg_DL_epoch, lfeet_DL_epoch=lfeet_DL_epoch,
         rfeet_DL_epoch=rfeet_DL_epoch)

# Save data in csv files
segmov_name = save_path + '\\SegmentMovements.csv'
SaveCSV( head_DL_filt, larm_DL_filt, rarm_DL_filt, lleg_DL_filt, rleg_DL_filt, lfeet_DL_filt, rfeet_DL_filt, segmov_name )

epoch_name = save_path + '\\SegmentEpochs.csv'
SaveCSV( head_DL_epoch, larm_DL_epoch, rarm_DL_epoch, lleg_DL_epoch, rleg_DL_epoch, lfeet_DL_epoch, rfeet_DL_epoch, epoch_name )

# Save epoch data in Mangold format
mangold_name = save_path + '\\SegmentEpochs.xiact'
SaveMangold( epoch_t, head_DL_epoch, larm_DL_epoch, rarm_DL_epoch, lleg_DL_epoch, rleg_DL_epoch, lfeet_DL_epoch, rfeet_DL_epoch, mangold_name, video_path )