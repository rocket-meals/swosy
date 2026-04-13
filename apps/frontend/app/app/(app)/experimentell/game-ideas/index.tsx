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
	name: string;
	rating: number;
	price: number;
}

interface Marking {
	name: string;
	dislikes: number;
}

interface Card {
	value: string;
	revealed: boolean;
	matched: boolean;
}

const dishes: Dish[] = [
	{ name: 'Pasta', rating: 4.5, price: 3.5 },
	{ name: 'Burger', rating: 4.1, price: 4.9 },
	{ name: 'Salad', rating: 3.8, price: 2.8 },
	{ name: 'Sushi', rating: 4.7, price: 5.5 },
	{ name: 'Pizza', rating: 4.3, price: 4.2 },
	{ name: 'Soup', rating: 3.9, price: 2.5 },
];

const markings: Marking[] = [
	{ name: 'Too Spicy', dislikes: 80 },
	{ name: 'Too Salty', dislikes: 60 },
	{ name: 'Too Sweet', dislikes: 40 },
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
		const other = ratingPair.find(d => d.name !== dish.name)!;
		setRatingResult(dish.rating >= other.rating ? '✔' : '✖');
		setRatingPair(getRandomPair());
	};

	const handlePriceGuess = (dish: Dish) => {
		const other = pricePair.find(d => d.name !== dish.name)!;
		setPriceResult(dish.price >= other.price ? '✔' : '✖');
		setPricePair(getRandomPair());
	};

	const handleMarkingGuess = (marking: Marking) => {
		setMarkingResult(marking.name === mostDisliked.name ? '✔' : '✖');
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
						key={dish.name}
						variant="ghost"
						usePlainText
						text={dish.name}
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
						key={m.name}
						variant="ghost"
						usePlainText
						text={m.name}
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
						key={dish.name}
						variant="ghost"
						usePlainText
						text={dish.name}
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
