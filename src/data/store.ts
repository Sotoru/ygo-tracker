// Cablaggio dell'istanza dell'app. KV = AsyncStorage: una sola API, web + native
// (niente localStorage/AsyncStorage separati). Vedi docs/adr/0001.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';

import { createRepository, type Repository } from './repository';

export const repository: Repository = createRepository(AsyncStorage, randomUUID);
