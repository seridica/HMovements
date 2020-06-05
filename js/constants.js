const body_parts = ['Head', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg', 'Left Foot', 'Right Foot'];

const epoch_length = 5.0;

const body_parts_threshold = {
	Head: 0.14,
	Arms: 0.19,
	Legs: 0.97,
	Feet: 0.36,
};

const body_parts_threshold_diagram = {
	Head: 0.14,
	LeftArm: 0.19,
	RightArm: 0.19,
	LeftLeg: 0.97,
	RightLeft: 0.97,
	LeftFoot: 0.36,
	RightFoot: 0.36,
};

module.exports = {
	body_parts,
	epoch_length,
	body_parts_threshold,
	body_parts_threshold_diagram,
};
