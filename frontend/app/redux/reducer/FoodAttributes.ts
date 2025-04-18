import {
  CLEAR_FOOD_ATTRIBUTES,
  SET_FOOD_ATTRIBUTE_GROUPS,
  SET_FOOD_ATTRIBUTES,
} from '@/redux/Types/types';

const initialState = {
  foodAttributeGroups: [],
  foodAttributes: [],
};

const foodAttributesReducer = (state = initialState, actions: any) => {
  switch (actions.type) {
    case SET_FOOD_ATTRIBUTE_GROUPS: {
      return {
        ...state,
        foodAttributeGroups: actions.payload,
      };
    }
    case SET_FOOD_ATTRIBUTES: {
      return {
        ...state,
        foodAttributes: actions.payload,
      };
    }
    case CLEAR_FOOD_ATTRIBUTES: {
      return {
        ...initialState,
      };
    }
    default:
      return state;
  }
};

export default foodAttributesReducer;
