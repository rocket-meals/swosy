export type FoodAreaDisplayProps = {
    theme: any;
    containerWidth?: string | number;
    foodsAreaColor: string;
};

export type FoodDetailsSectionBaseProps = FoodAreaDisplayProps & {
    translate: (key: string) => string;
    previousFeedback: any;
    isAccountRequired?: boolean;
};
