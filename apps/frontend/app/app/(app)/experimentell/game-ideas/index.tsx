import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAppSelector } from '@/redux/hooks';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import styles from './styles';
import AppButton from '@/components/AppButton';

interface Dish {
	id: string;
	nameKey: TranslationKeys;
	rating: number;
	price: number;
}

interface Marking {
	id: string;
	nameKey: TranslationKeys;
	dislikes: number;
}

interface Card {
	value: string;
	revealed: boolean;
	matched: boolean;
}

const dishes: Dish[] = [
	{ id: 'pasta', nameKey: TranslationKeys.demo_dish_pasta, rating: 4.5, price: 3.5 },
	{ id: 'burger', nameKey: TranslationKeys.demo_dish_burger, rating: 4.1, price: 4.9 },
	{ id: 'salad', nameKey: TranslationKeys.demo_dish_salad, rating: 3.8, price: 2.8 },
	{ id: 'sushi', nameKey: TranslationKeys.demo_dish_sushi, rating: 4.7, price: 5.5 },
	{ id: 'pizza', nameKey: TranslationKeys.demo_dish_pizza, rating: 4.3, price: 4.2 },
	{ id: 'soup', nameKey: TranslationKeys.demo_dish_soup, rating: 3.9, price: 2.5 },
];

const markings: Marking[] = [
	{ id: 'too_spicy', nameKey: TranslationKeys.demo_marking_too_spicy, dislikes: 80 },
	{ id: 'too_salty', nameKey: TranslationKeys.demo_marking_too_salty, dislikes: 60 },
	{ id: 'too_sweet', nameKey: TranslationKeys.demo_marking_too_sweet, dislikes: 40 },
];

const foodIcons = ['🍔', '🍕', '🍣', '🥗', '🍰', '🍟', '🌮', '🍜', '🍩', '🍇', '🍤', '🥐'];

const getRandomPair = (): [Dish, Dish] => {
	const shuffled = [...dishes].sort(() => Math.random() - 0.5);
	return [shuffled[0], shuffled[1]];
};

const generateMemoryBoard = (): (Card | null)[] => {
	const doubled = [...foodIcons, ...foodIcons];
	const board: (Card | null)[] = doubled.map(v => ({
		value: v,
		revealed: false,
		matched: false,
	}));
	board.splice(Math.floor(Math.random() * (board.length + 1)), 0, null);
	return board.sort(() => Math.random() - 0.5);
};

const GameIdeas = () => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { language } = useAppSelector(state => state.settings);
	const isArabic = language === 'ar';
	useSetPageTitle(TranslationKeys.game_ideas);

	const [ratingPair, setRatingPair] = useState<[Dish, Dish]>(getRandomPair());
	const [ratingResult, setRatingResult] = useState<string>('');

	const [pricePair, setPricePair] = useState<[Dish, Dish]>(getRandomPair());
	const [priceResult, setPriceResult] = useState<string>('');

	const [markingResult, setMarkingResult] = useState<string>('');

	const [board, setBoard] = useState<(Card | null)[]>(generateMemoryBoard());
	const [selected, setSelected] = useState<number[]>([]);

	const mostDisliked = useMemo(() => markings.reduce((a, b) => (a.dislikes > b.dislikes ? a : b), markings[0] || {}), []);

	const handleRatingGuess = (dish: Dish) => {
		const other = ratingPair.find(d => d.id !== dish.id)!;
		setRatingResult(dish.rating >= other.rating ? '✔' : '✖');
		setRatingPair(getRandomPair());
	};

	const handlePriceGuess = (dish: Dish) => {
		const other = pricePair.find(d => d.id !== dish.id)!;
		setPriceResult(dish.price >= other.price ? '✔' : '✖');
		setPricePair(getRandomPair());
	};

	const handleMarkingGuess = (marking: Marking) => {
		setMarkingResult(marking.id === (mostDisliked as Marking).id ? '✔' : '✖');
	};

	const handleCardPress = (index: number) => {
		const card = board[index];
		if (!card || card.revealed || card.matched) return;
		const newBoard = [...board];
		newBoard[index] = { ...card, revealed: true };
		const newSelected = [...selected, index];
		setBoard(newBoard);
		if (newSelected.length === 2) {
			const [first, second] = newSelected;
			if (newBoard[first]?.value === newBoard[second]?.value) {
				newBoard[first]!.matched = true;
				newBoard[second]!.matched = true;
				setBoard(newBoard);
			} else {
				setTimeout(() => {
					const hidden = [...newBoard];
					hidden[first] = { ...hidden[first]!, revealed: false };
					hidden[second] = { ...hidden[second]!, revealed: false };
					setBoard(hidden);
				}, 800);
			}
			setSelected([]);
		} else {
			setSelected(newSelected);
		}
	};

	return (
		<ScrollView style={{ flex: 1, backgroundColor: theme.screen.background }} contentContainerStyle={styles.container}>
			<Text style={{ ...styles.heading, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>{translate(TranslationKeys.game_ideas)}</Text>

			<Text style={{ ...styles.subheading, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>{translate(TranslationKeys.guess_better_rated_dish)}</Text>
			<View style={[styles.row, isArabic ? { flexDirection: 'row-reverse' } : null]}>
				{ratingPair.map(dish => (
					<AppButton
						key={dish.id}
						variant="ghost"
						usePlainText
						text={translate(dish.nameKey)}
						onPress={() => handleRatingGuess(dish)}
						style={{ ...styles.button, backgroundColor: theme.screen.iconBg, marginVertical: 0 }}
						textStyle={{ color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }}
					/>
				))}
			</View>
			{ratingResult !== '' && <Text style={{ ...styles.result, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }}>{ratingResult}</Text>}

			<Text style={{ ...styles.subheading, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>{translate(TranslationKeys.guess_most_disliked_marking)}</Text>
			<View style={[styles.row, isArabic ? { flexDirection: 'row-reverse' } : null]}>
				{markings.map(m => (
					<AppButton
						key={m.id}
						variant="ghost"
						usePlainText
						text={translate(m.nameKey)}
						onPress={() => handleMarkingGuess(m)}
						style={{ ...styles.button, backgroundColor: theme.screen.iconBg, marginVertical: 0 }}
						textStyle={{ color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }}
					/>
				))}
			</View>
			{markingResult !== '' && <Text style={{ ...styles.result, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }}>{markingResult}</Text>}

			<Text style={{ ...styles.subheading, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>{translate(TranslationKeys.food_memory_game)}</Text>
			<View style={styles.memoryContainer}>
				{board.map((card, idx) =>
					card ? (
						<AppButton
							key={idx}
							variant="ghost"
							usePlainText
							text={card.revealed || card.matched ? card.value : '?'}
							onPress={() => handleCardPress(idx)}
							style={{ ...styles.memoryCard, backgroundColor: theme.screen.iconBg, marginVertical: 0 }}
							textStyle={{ color: theme.screen.text, fontSize: 24 }}
						/>
					) : (
						<View key={idx} style={styles.memoryCard} />
					)
				)}
			</View>

			<Text style={{ ...styles.subheading, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left', writingDirection: isArabic ? 'rtl' : 'ltr' }}>{translate(TranslationKeys.guess_more_expensive_dish)}</Text>
			<View style={[styles.row, isArabic ? { flexDirection: 'row-reverse' } : null]}>
				{pricePair.map(dish => (
					<AppButton
						key={dish.id}
						variant="ghost"
						usePlainText
						text={translate(dish.nameKey)}
						onPress={() => handlePriceGuess(dish)}
						style={{ ...styles.button, backgroundColor: theme.screen.iconBg, marginVertical: 0 }}
						textStyle={{ color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }}
					/>
				))}
			</View>
			{priceResult !== '' && <Text style={{ ...styles.result, color: theme.screen.text, textAlign: isArabic ? 'right' : 'left' }}>{priceResult}</Text>}
		</ScrollView>
	);
};

export default GameIdeas;
