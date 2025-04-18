import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  sheetView: {
    width: '100%',
    height: '100%',
    borderTopRightRadius: 28,
    borderTopLeftRadius: 28,
    padding: 10,
    paddingBottom: 0,
  },
  contentContainer: {
    alignItems: 'center',
  },
  sheetHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopRightRadius: 28,
    borderTopLeftRadius: 28,
  },
  sheetcloseButton: {
    width: 45,
    height: 45,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetHeading: {
    fontFamily: 'Poppins_700Bold',
    marginLeft: 30,
    fontSize: 24,
    textAlign: 'center',
  },
  mainContentContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  menuHeading: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  col: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
  },
  body: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 20,
  },
});
