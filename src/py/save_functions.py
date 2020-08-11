# -*- coding: utf-8 -*-
"""
Created on Tue Aug 11 14:12:17 2020

Save functions for vigilance UI

@author: Calvin
"""

import numpy as np

"""
Generic function for saving csv files from the UI.
Assumes you are saving body segment data and sets up the csv file and header
accordingly.
"""
def SaveCSV(head_dat, larm_dat, rarm_dat, lleg_dat, rleg_dat, lfeet_dat, rfeet_dat, fname):

    head_dat.shape = (head_dat.shape[0], 1)
    larm_dat.shape = (larm_dat.shape[0], 1)
    rarm_dat.shape = (rarm_dat.shape[0], 1)
    lleg_dat.shape = (lleg_dat.shape[0], 1)
    rleg_dat.shape = (rleg_dat.shape[0], 1)
    lfeet_dat.shape = (lfeet_dat.shape[0], 1)
    rfeet_dat.shape = (rfeet_dat.shape[0], 1)
    
    csv_out = np.append( head_dat, larm_dat, axis=1 )
    csv_out = np.append( csv_out, rarm_dat, axis=1 )
    csv_out = np.append( csv_out, lleg_dat, axis=1 )
    csv_out = np.append( csv_out, rleg_dat, axis=1 )
    csv_out = np.append( csv_out, lfeet_dat, axis=1 )
    csv_out = np.append( csv_out, rfeet_dat, axis=1 )
    
    np.savetxt(fname, csv_out, delimiter=',', header='Head, Left Arm, Right Arm, Left Leg, Right Leg, Left Foot, Right Foot')
    
    return

"""
Function for saving movement epoch definitions for display in Mangold
"""
def SaveMangold(t_dat, head_dat, larm_dat, rarm_dat, lleg_dat, rleg_dat, lfeet_dat, rfeet_dat, fname, vname):
    
    # Write file using python input output, allows for multiple header lines
    f = open(fname, 'w')
    
    # Header for Mangold
    top_header = 'SYSTEM: OpenPoseAnnotation<BR><BR>DEFINE: FPS,30<BR>DEFINE: MainFileVersion,10<BR>COLUMN: Body Segment<BR>COLUMN: Movement<BR>\n'
    f.write(top_header)
    
    # Invar header
    invar_header = '[INDVAR]\n'
    f.write(invar_header)
    
    # Label headers
    label_header = 'Level\tOnset\tOffset\tMemo\tBody Segment\tMovement\n'
    f.write(label_header)
    
    # Level 1
    lvl1_input = '1\t0\t0\t' + vname + '\t \t \n'
    f.write(lvl1_input)
    
    # Go through each section 
    f = MangoldLevel2( t_dat, head_dat, 'Head', f )
    f = MangoldLevel2( t_dat, larm_dat, 'Left Arm', f )
    f = MangoldLevel2( t_dat, rarm_dat, 'Right Arm', f )
    f = MangoldLevel2( t_dat, lleg_dat, 'Left Leg', f )
    f = MangoldLevel2( t_dat, rleg_dat, 'Right Leg', f )
    f = MangoldLevel2( t_dat, lfeet_dat, 'Left Foot', f )
    f = MangoldLevel2( t_dat, rfeet_dat, 'Right Foot', f )
    
    return f.close()

"""
Helper function for saving movement data for each segment
"""
def MangoldLevel2( t_dat, data_dat, segment_name, f ):
    
    # Level 2
    lvl2_input = '2\t0\t'+str(int(t_dat[-1]/30*10000000))+'\t \t'+segment_name+'\n'
    f.write(lvl2_input)
    
    # Level 3 data
    prev_t = 0
    for i in range(len(data_dat)):
        if data_dat[i]:
            lvl3_input = '3\t'+str(int(prev_t/30*10000000))+'\t'+str(int(t_dat[i]/30*10000000))+'\t \t'+ segment_name + '\t Detected Movement \n'
        else:
            lvl3_input = '3\t'+str(int(prev_t/30*10000000))+'\t'+str(int(t_dat[i]/30*10000000))+'\t \t'+ segment_name + '\t No Movement \n'
        prev_t = t_dat[i]
        f.write(lvl3_input)
    
    return f