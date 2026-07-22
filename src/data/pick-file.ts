// Selezione + lettura di un file di testo, cross-platform (web + native) con la
// stessa firma. La differenza di capability (come si legge il contenuto) è isolata
// qui dietro una feature-detection, non un ramo Platform.OS (vedi AGENTS.md).
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export interface PickedFile {
  name: string; // nome originale, es. "goat-control.ydk" (usato come default del nome deck)
  text: string;
}

/** Apre la UI di sistema; null se l'utente annulla. Nessun filtro MIME: `.ydk` non è un tipo registrato. */
export async function pickTextFile(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  if (res.canceled) return null;
  const asset = res.assets[0];
  // Web: DocumentPicker espone il File del browser → .text(). Native: leggo dal uri
  // in cache con la File API di expo-file-system.
  const text = asset.file ? await asset.file.text() : await new File(asset.uri).text();
  return { name: asset.name, text };
}
