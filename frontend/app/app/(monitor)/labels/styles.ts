import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  shortCode: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  iconMarking: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    margin: 10,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 30,
    height: 30,
    marginRight: 5,
    borderRadius: 25,
  },
  title: {
    marginLeft: 5,
    fontSize: 17,
    maxWidth: '90%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    marginLeft: 10,
  },
  logo: {
    width: 300,
    height: 100,
    marginRight: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  timestamp: {
    fontSize: 14,
    color: '#555',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
});