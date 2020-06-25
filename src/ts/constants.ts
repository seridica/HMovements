export const epochLength = 5.0;

export interface IGeneralThresholds {
	[Key: string]: number;
}

export const generalThresholds: IGeneralThresholds = {
	Head: 0.14,
	Arms: 0.19,
	Legs: 0.97,
	Feet: 0.36,
};

export interface IBodyPartDetail {
	name: string;
	threshold: number;
}

interface IVideoDataDetail<> {
	[Key: string]: (number | boolean)[];
}

export interface IVideoData {
	motion: IVideoDataDetail;
	epoch: IVideoDataDetail;
}

export interface BodyParts {
	[Key: string]: IBodyPartDetail;
}

export const bodyParts: BodyParts = {
	Head: {
		name: 'Head',
		threshold: 0.14,
	},
	LeftArm: {
		name: 'Left Arm',
		threshold: 0.19,
	},
	RightArm: {
		name: 'Right Arm',
		threshold: 0.19,
	},
	LeftLeg: {
		name: 'Left Leg',
		threshold: 0.97,
	},
	RightLeg: {
		name: 'Right Leg',
		threshold: 0.97,
	},
	LeftFoot: {
		name: 'Left Foot',
		threshold: 0.36,
	},
	RightFoot: {
		name: 'Right Foot',
		threshold: 0.36,
	},
};

export const fps = 30.0;
