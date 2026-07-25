// Scrittura + condivisione di un file di testo, cross-platform con la stessa
// firma (controparte di pick-file.ts). Web e native non hanno un modo comune
// di "consegnare" un file all'utente, quindi la differenza è isolata qui:
// web forza un download via Blob, native scrive in cache e apre lo share
// sheet con expo-sharing (vedi AGENTS.md).
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** true = condiviso/scaricato; false = share non disponibile su questo device native. */
export async function shareTextFile(filename: string, text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Firefox richiede l'anchor nel DOM per far scattare il download
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); // revoca dopo l'avvio del download, non prima
    return true;
  }

  if (!(await Sharing.isAvailableAsync())) return false;
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  await file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: filename });
  return true;
}
