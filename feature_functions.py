import json
import numpy as np
import matplotlib.pyplot as plt
import os

"""
Adapted from Bu's code, May 7, 2020
### open_SCIT_json: read all json file in video_name +'_output/' + video_name + '_json/' dir.
### input: path to json output directory
### output: video data with the coordination of each body parts (rows is frame, column is body part)
"""

def open_SCIT_json(json_path):
    
    video_data = []
    json_files = os.listdir(json_path)
    
    for fname in json_files:
        with open(json_path + fname) as json_file:
            data = json.load(json_file)

        if data['people'] != []:
            dirty_points = np.array(data['people'][0]['pose_keypoints_2d'])

            n = 25
            x_idx = 3 * np.arange(n)
            y_idx = x_idx + 1

            x_list = dirty_points[x_idx]
            y_list = dirty_points[y_idx]

        else:
            x_list = np.zeros(25)
            y_list = np.zeros(25)

        video_data.append(list(zip(x_list, y_list)))

    return np.array(video_data)


#################################################################
### draw_figure: draw the figure of function
### input: video name, part name, function name, data 
### output: 
#################################################################

def draw_figure(part_name, video_name,SCIT_start, SCIT_end, function_name, V):
	size = len(V)

	matplotlib.rc('xtick', labelsize=40)
	matplotlib.rc('ytick', labelsize=40)
	plt.figure(figsize=(60,10))
	plt.plot(np.arange(0,size) / 1800, V,'-')
	plt.xticks(np.arange(min(np.arange(0,size)/1800), max(np.arange(0,size)/1800)+1, 1.0))
	plt.xlabel('min', fontsize=40)
	plt.ylabel('pixel/frame', fontsize=40)
	plt.savefig(( video_name +'_' + part_name +'_'+str(SCIT_start)+'_'+'_'+ str(SCIT_end)+'_'+ function_name + '.jpg'))
	plt.clf()

####
#### Calculate the magnitude from raw data:
#### input: video_data[frame, body part], threshold(unsed), start time, end time
#### output: magnitude -> curr_D[frame]
####

def extract_max_vector_length(part_num, video_data, start_t, end_t):
	D = []
	curr_D = video_data[:,part_num]

	def substract(array1, array2):
		for i in range(len(array1)):
			if array1[i][0] != 0 and array1[i][1] != 0:
				array1[i] = array1[i] - array2[i]

		return array1

	if part_num < 8 and part_num != 1:
		curr_D = substract(video_data[:,part_num], video_data[:,1])
	elif part_num > 8 and part_num < 15:
		curr_D = substract(video_data[:,part_num], video_data[:,8])
	elif part_num >= 15 and part_num <= 18:
		curr_D = substract(video_data[:,part_num], video_data[:,1])
	elif part_num >= 19 and part_num <= 21:
		curr_D = substract(video_data[:,part_num], video_data[:,14])
	elif part_num >= 22 and part_num <= 24:
		curr_D = substract(video_data[:,part_num], video_data[:,11])

	start_f = int(start_t * 1800)
	end_f = int(end_t * 1800)

	#calculate the movement of part in each frame
	for i in range(start_f, end_f):
		if i < len(curr_D):
			if curr_D[i][0] == 0 or curr_D[i][1] == 0:
				D.append(0)
			else:
				T = []
				for j in range(30): # interval = 30frames->1second
					if i+j < len(curr_D):
						if curr_D[i+j][0] == 0 or curr_D[i+j][1] == 0:
							T.append(0)
						else:
							velocity = ((curr_D[i+j][0] - curr_D[i][0])**2 + (curr_D[i+j][1] - curr_D[i][1])**2)**(1/2)
							T.append(velocity)
				D.append(np.max(T))
		else:
			D.append(0)

	return D

####
#### Calculate the magnitude from raw data:
#### input: video_data[frame, body part], threshold(unsed), start time, end time
#### output: max magnitude in 5 sec -> curr_D[1 min epoch]
####

def epoch_threshold(insig, epoch_len, threshold, start_t, end_t):
    start_f = int(start_t * 1800)
    end_f = int(end_t * 1800)
    epochs = []

    # Run through epochs until we reach the end
    i = start_f
    while i+int(epoch_len*30) < end_f:
        epochs.append(np.max(insig[i:int(i+epoch_len*30)]))
        i = int( i + epoch_len*30 )

    return np.array( epochs ) > threshold

"""
Compute normalization factor (neck to torso length)
"""
def compute_nor(video_data, start_t, end_t):
	D = []
	neck = video_data[:,1]
	hip = video_data[:,8]

	start_f = int(start_t * 1800)
	end_f = int(end_t * 1800)

	#calculate the movement of part in each frame
	for i in range(start_f, end_f):
		if i < len(neck):
            # Only include if both neck and hip data exist
			if not( neck[i][0] == 0 or hip[i][0] == 0 ):
				dis = ((neck[i][0] - hip[i][0])**2 + (neck[i][1] - hip[i][1])**2)**(1/2)
				D.append(dis)
		else:
			D.append(0)

	return np.median(D)

