// @flow

import React from 'react';
import {
    Editor,
    EditorState,
    ContentState,
    SelectionState,
    Modifier,
    DefaultDraftBlockRenderMap
} from 'draft-js';
import { Map } from 'immutable';

import ImageBlock from './ImageBlock';

const IMAGE_BLOCK = 'image';

require('draft-js/dist/Draft.css');

const isWordEndingChar = char => [' ', '.', ',', '!', ';'].indexOf(char) !== -1;

const isImageEndingChar = char => char === '%';

const getCompletedWord = (block, offset) => {
    const text = block.getText();
    const textToOffset = text.substr(0, offset);
    const spaceOffset = textToOffset.lastIndexOf(' ');
    return spaceOffset === -1 ? textToOffset : textToOffset.substr(spaceOffset + 1);
};

const getBlockRendererFn = (getEditorState, onChange) => (block) => {
    const type = block.getType();
    switch (type) {
        case IMAGE_BLOCK:
            return {
                component: ImageBlock,
                editable: false,
                props: {
                    getEditorState,
                    onChange,
                }
            };
        default:
            return null;
    }
};

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
    let newText = '';
    const text = block.getText();
    if (block.getLength() >= 2) {
        newText = text.substr(1);
    }
    const newBlock = block.merge({
        text: newText,
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

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty()
        };

        this.blockRenderMap = Map({
            [IMAGE_BLOCK]: {
                element: 'div',
            },
        }).merge(DefaultDraftBlockRenderMap);

        this.blockRendererFn = getBlockRendererFn(this.getEditorState, this.onChange);

        this.substituteWords = {
            boring: 'exciting',
            lame: 'cool',
            typical: 'unusual',
            worst: 'best',
            hate: 'love',
            dislike: 'adore',
            stupid: 'amazing',
            dumb: 'brilliant',
            unoriginal: 'unique',
            [':(']: ':)'
        };

        this.onChange = (editorState) => this.setState({ editorState });

        this.handleBeforeInput = this.handleBeforeInput.bind(this);
    }

    handleBeforeInput(char) {
        if (isWordEndingChar(char)) {
            return this.handleWordSubstitution(char);
        }
        if (isImageEndingChar(char)) {
            console.log('image!');
            return this.handleImageBlock();
        }
        return false;
    }

    handleImageBlock() {
        const { editorState } = this.state;

        const selectionState = editorState.getSelection();
        const currentKey = selectionState.getAnchorKey();

        // turn the current block into an image
        const editorStateWithImageBlock = resetBlockType(editorState, currentKey, IMAGE_BLOCK);

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

        this.onChange(editorWithCorrectFocus);
        setTimeout(() => console.dir(this.state.editorState.getCurrentContent().getBlockMap().toJS()), 1000);
        return true;
    }

    handleWordSubstitution(char) {
        const { editorState } = this.state;
        const selectionState = editorState.getSelection();
        const key = selectionState.getStartKey();
        const currentContentState = editorState.getCurrentContent();
        const currentBlock = currentContentState.getBlockForKey(key);
        const offset = selectionState.focusOffset;
        const word = getCompletedWord(currentBlock, offset);

        if (this.substituteWords.hasOwnProperty(word)) {
            const newContentState = Modifier.replaceText(
                editorState.getCurrentContent(),
                new SelectionState({
                    anchorKey: key,
                    anchorOffset: offset - word.length,
                    focusKey: key,
                    focusOffset: offset,
                }),
                this.substituteWords[word] + char
            );
            const stateWithReplacedText = EditorState.push(editorState, newContentState, 'replace-text');

            // Calculate the new cursor position, accounting for the newly-entered character
            const newOffset = offset - word.length + this.substituteWords[word].length + 1;
            const stateWithCorrectFocus = EditorState.forceSelection(
                stateWithReplacedText,
                new SelectionState({
                    anchorKey: currentBlock.getKey(),
                    anchorOffset: newOffset,
                    focusKey: currentBlock.getKey(),
                    focusOffset: newOffset,
                })
            );
            this.onChange(stateWithCorrectFocus);
            return true;
        }
    }

    render() {
        const appWrapperStyle = {
            width: 800,
            margin: '20px auto',
        };
        const editorWrapperStyle = {
            width: 600,
            minHeight: 400,
            border: '1px solid gray',
        };

        return (
            <div style={appWrapperStyle}>
                <h1>Morale Booster v0.1</h1>
                <div style={editorWrapperStyle}>
                    <Editor
                        editorState={this.state.editorState}
                        handleBeforeInput={this.handleBeforeInput}
                        onChange={this.onChange}
                        blockRenderMap={this.blockRenderMap}
                        blockRendererFn={this.blockRendererFn}
                    />
                </div>
            </div>
        );
    }
}
