import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  card: {
    borderRadius: 21,
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  cardContent: {
    alignItems: 'stretch',
    borderTopWidth: 3,
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 18,
    position: 'relative',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 10,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  favContainer: {
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    top: 5,
    right: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favContainerWarn: {
    width: 35,
    height: 35,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    top: 45,
    right: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    gap: 5,
    width: 35,
    height: 80,
    position: 'absolute',
    top: 10,
    left: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  categoryLogo: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    resizeMode: 'cover',
  },
  foodName: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 5,
  },
  priceButton: {
    width: '100%',
    height: 35,
    backgroundColor: 'white',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginTop: 2,
  },
  heading: {
    fontSize: 40,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  priceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
