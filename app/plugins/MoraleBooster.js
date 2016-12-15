import { EditorState, Modifier, SelectionState } from 'draft-js';

export default function createMoraleBoosterPlugin() {

    const substituteWords = {
        lame: 'cool',
        boring: 'exciting',
        typical: 'unusual',
        worst: 'best',
        hate: 'love',
        dislike: 'adore',
        stupid: 'amazing',
        dumb: 'brilliant',
        unoriginal: 'unique',
        terrible: 'incredible',
        waste: 'wisely spend',
        [':(']: ':)'
    };

    const isWordEndingChar = char => [' ', '.', ',', '!', ';'].indexOf(char) !== -1;

    const getCompletedWord = (block, offset) => {
        const text = block.getText();
        const textToOffset = text.substr(0, offset);
        const spaceOffset = textToOffset.lastIndexOf(' ');
        return spaceOffset === -1 ? textToOffset : textToOffset.substr(spaceOffset + 1);
    };

    const handleWordSubstitution = (char, getEditorState, setEditorState) => {
        const editorState = getEditorState();
        const selectionState = editorState.getSelection();
        const key = selectionState.getStartKey();
        const currentContentState = editorState.getCurrentContent();
        const currentBlock = currentContentState.getBlockForKey(key);
        const offset = selectionState.focusOffset;
        const word = getCompletedWord(currentBlock, offset);

        if (substituteWords.hasOwnProperty(word)) {
            const newContentState = Modifier.replaceText(
                editorState.getCurrentContent(),
                new SelectionState({
                    anchorKey: key,
                    anchorOffset: offset - word.length,
                    focusKey: key,
                    focusOffset: offset,
                }),
                substituteWords[word] + char
            );
            const stateWithReplacedText = EditorState.push(editorState, newContentState, 'replace-text');

            // Calculate the new cursor position, accounting for the newly-entered character
            const newOffset = offset - word.length + substituteWords[word].length + 1;
            const stateWithCorrectFocus = EditorState.forceSelection(
                stateWithReplacedText,
                new SelectionState({
                    anchorKey: currentBlock.getKey(),
                    anchorOffset: newOffset,
                    focusKey: currentBlock.getKey(),
                    focusOffset: newOffset,
                })
            );
            setEditorState(stateWithCorrectFocus);
            return 'handled';
        }
    };

    const handleBeforeInput = (char, { getEditorState, setEditorState }) => {
        if (isWordEndingChar(char)) {
            return handleWordSubstitution(char, getEditorState, setEditorState);
        }
        return false;
    };

    return {
        handleBeforeInput
    };
}