import { Icon } from '@/components/Themed';
import React, {FunctionComponent} from 'react';

export enum RatingType{
  disabled='disabled',
  hearts = 'hearts',
  likes = 'likes',
  stars= 'stars',
  smilies='smilies'
}
export interface AppState{
  ratingType: RatingType,
  ratingValue: number,
  isActive: boolean,
  color?: string
}
export const MAX_RATING_VALUE = 5;
export const RatingValueIcon: FunctionComponent<AppState> = (props) => {
	const ratingType = props.ratingType;
	const isActive = props.isActive;
	const ratingValue = props.ratingValue;

	const maxRatingValue = 5;

	function renderOnlyLikes() {
		const icon = isActive ? 'heart' : 'heart-outline';
		return (
			<Icon color={props?.color} name={icon}></Icon>
		)
	}

	function renderLikeAndDislike() {
		let iconName = 'thumb-down';
		if (ratingValue >= maxRatingValue) {
			iconName = 'thumb-up';
		}
		if (!isActive) {
			iconName+='-outline';
		}

		return <Icon color={props?.color} name={iconName}></Icon>
	}

	function renderSmily() {
		const smily_5 = 'emoticon';
		const smily_4 = 'emoticon-happy';
		const smily_3 = 'emoticon-neutral';
		const smily_2 = 'emoticon-sad';
		const smily_1 = 'emoticon-cry';

		let name = 'emoticon-cool';

		switch (ratingValue) {
		case 5: name = smily_5; break;
		case 4: name = smily_4; break;
		case 3: name = smily_3; break;
		case 2: name = smily_2; break;
		case 1: name = smily_1; break;
		}

		if (!isActive) {
			name+='-outline';
		}

		return (
			<Icon color={props?.color} name={name}/>
		)
	}

	function renderStar() {
		let name = 'star';

		if (!isActive) {
			name+='-outline';
		}

		return (
			<Icon color={props?.color} name={name}/>
		)
	}

	function renderRatingType() {
		switch (ratingType) {
		case RatingType.disabled: return null;
		case RatingType.hearts: return renderOnlyLikes();
		case RatingType.likes: return renderLikeAndDislike();
		case RatingType.stars: return renderStar();
		case RatingType.smilies: return renderSmily();
		default: return null
		}
	}

	return renderRatingType()
}