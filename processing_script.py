# -*- coding: utf-8 -*-
"""
Created on Mon May  4 16:42:10 2020

@author: Calvin
"""

import os
from feature_functions import *
from scipy import signal
import matplotlib.pyplot as plt

"""
Code for running OpenPose
"""

# set dir for Openpose:
op_path = 'D:/UBC/Vigilance/OpenPose/openpose-CPU/' # ex: ~\Openpose
#op_path = 'D:/UBC/Vigilance/OpenPose/openpose-GPU/'

# set path for video:
vid_fldr = 'D:/UBC/Vigilance/'  # ex: ~\DL00006.mov
vid_name = 'test'
vid_ext = '.mp4'
vid_path = vid_fldr + vid_name + vid_ext

# set parameter to save keypoint
json_fldr ='D:/UBC/Vigilance/output/'
json_path = json_fldr + vid_name + '/'

# set parameter for timestamp of video, in minute
start_t = 0.0 # ex: enter 10.5 for 10:30
end_t = 1.0

# Default thresholds - Taken from Bu's code
head_thresh = 0.14
arm_thresh = 0.19
leg_thresh = 0.97
feet_thresh = 0.36

################################################################
#  COMMENT THIS OUT IF YOU ALREADY RAN OPENPOSE ON YOUR VIDEO  #
################################################################
# Go to top level open pose directory
os.chdir(op_path)

# Run OpenPose - Note, need to tune these inputs to run on other computers and also output the rendered skeleton
# Currently settings are just for saving json
#os.system(op_path + 'bin/OpenPoseDemo.exe  --video ' + vid_path + ' --write_json ' + json_path + ' --display 0')
################################################################
################################################################

"""
Code for post-processing json outputs
This is adapted from Bu's jupyter notebook code:
Newest_version.ipynb
"""
# First extract raw data from the json files
json_data = open_SCIT_json( json_path )

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
head_DL_epoch = epoch_threshold(head_DL_filt, 5.0, head_thresh, 0.0, 1.0)
larm_DL_epoch = epoch_threshold(larm_DL_filt, 5.0, arm_thresh, 0.0, 1.0)
rarm_DL_epoch = epoch_threshold(rarm_DL_filt, 5.0, arm_thresh, 0.0, 1.0)
lleg_DL_epoch = epoch_threshold(lleg_DL_filt, 5.0, leg_thresh, 0.0, 1.0)
rleg_DL_epoch = epoch_threshold(rleg_DL_filt, 5.0, leg_thresh, 0.0, 1.0)
lfeet_DL_epoch = epoch_threshold(lfeet_DL_filt, 5.0, feet_thresh, 0.0, 1.0)
rfeet_DL_epoch = epoch_threshold(rfeet_DL_filt, 5.0, feet_thresh, 0.0, 1.0)