import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  list: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  col: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  label: {
    fontFamily: 'Poppins_700Bold',
  },
  value: {
    fontFamily: 'Poppins_400Regular',
  },
});
