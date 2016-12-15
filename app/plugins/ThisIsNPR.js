import {
    EditorState,
    Modifier,
    SelectionState,
    DefaultDraftBlockRenderMap
} from 'draft-js';
import { Map } from 'immutable';

import ImageBlock from '../components/ImageBlock';

export default function createThisIsNPRPlugin() {
    const IMAGE_BLOCK = 'image';

    const getDefaultBlockData = (blockType, initialData = {}) => {
        switch (blockType) {
            case IMAGE_BLOCK:
                return {};
            default:
                return initialData;
        }
    };

    const resetBlockType = (editorState, key, newType = 'unstyled') => {
        const contentState = editorState.getCurrentContent();
        const blockMap = contentState.getBlockMap();
        const block = blockMap.get(key);
        const newBlock = block.merge({
            text: '',
            type: newType,
            data: getDefaultBlockData(newType),
        });
        const newContentState = contentState.merge({
            blockMap: blockMap.set(key, newBlock),
            selectionAfter: new SelectionState({
                anchorKey: key,
                anchorOffset: 0,
                focusKey: key,
                focusOffset: 0,
            }),
        });
        return EditorState.push(editorState, newContentState, 'change-block-type');
    };

    const shouldTriggerImage = (char, editorState) => {
        const currentContent = editorState.getCurrentContent();
        const currentSelection = editorState.getSelection();
        const currentBlock = currentContent.getBlockForKey(currentSelection.anchorKey);
        const stringToMatch = currentBlock.getText().substring(currentSelection.anchorOffset - ('this is np'.length), currentSelection.anchorOffset) + char;
        return stringToMatch.search(/this is npr/i) !== -1;
    };

    const handleImageBlock = (getEditorState, setEditorState) => {
        const editorState = getEditorState();

        // if the current block is the first block, split it (so the first block is always unstyled)
        const editorStateToBeTurnedIntoImage = (() => {
            const currentContent = editorState.getCurrentContent();
            const selectionState = editorState.getSelection();
            const currentKey = selectionState.getAnchorKey();
            if (!currentContent.getKeyBefore(currentKey)) {
                const selectionState = editorState.getSelection();
                const currentKey = selectionState.getAnchorKey();
                const editorStateSplit = EditorState.push(
                    editorState, Modifier.splitBlock(currentContent, selectionState), 'split-block');
                const contentSplit = editorStateSplit.getCurrentContent();
                const nextKey = contentSplit.getKeyAfter(currentKey);
                return EditorState.forceSelection(editorStateSplit,
                    new SelectionState({
                        anchorKey: nextKey,
                        anchorOffset: 0,
                        focusKey: nextKey,
                        focusOffset: 0,
                    })
                );
            } else {
                return editorState;
            }
        })();

        const selectionState = editorStateToBeTurnedIntoImage.getSelection();
        const currentKey = selectionState.getAnchorKey();

        // turn the current block into an image
        const editorStateWithImageBlock = resetBlockType(editorStateToBeTurnedIntoImage, currentKey, IMAGE_BLOCK);

        // split the image block in two
        const contentState = editorStateWithImageBlock.getCurrentContent();
        const contentWithNewBlock = Modifier.splitBlock(contentState, selectionState);
        const editorStateWithTwoBlocks = EditorState.push(editorStateWithImageBlock, contentWithNewBlock, 'split-block');

        // turn the second image block back into a text block
        const nextKey = contentWithNewBlock.getKeyAfter(currentKey);
        const editorStateWithImageAndTextBlock = resetBlockType(editorStateWithTwoBlocks, nextKey, 'unstyled');

        const editorWithCorrectFocus = EditorState.forceSelection(
            editorStateWithImageAndTextBlock,
            new SelectionState({
                anchorKey: nextKey,
                anchorOffset: 0,
                focusKey: nextKey,
                focusOffset: 0,
            })
        );

        setEditorState(editorWithCorrectFocus);
        return 'handled';
    };

    const handleBeforeInput = (char, { getEditorState, setEditorState }) => {
        if (shouldTriggerImage(char, getEditorState())) {
            return handleImageBlock(getEditorState, setEditorState);
        }
        return false;
    };

    const blockRendererFn = (block) => {
        const type = block.getType();
        switch (type) {
            case IMAGE_BLOCK:
                return {
                    component: ImageBlock,
                    editable: false,
                    props: {}
                };
            default:
                return null;
        }
    };

    const blockRenderMap = Map({
        [IMAGE_BLOCK]: {
            element: 'div',
        },
    }).merge(DefaultDraftBlockRenderMap);

    return {
        handleBeforeInput,
        blockRendererFn,
        blockRenderMap,
    };
}