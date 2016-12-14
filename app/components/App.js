// @flow

import React from 'react';
import { Editor, EditorState, ContentState, SelectionState, Modifier, createDecorator } from 'draft-js';

require('draft-js/dist/Draft.css');

const isWordEndingChar = char => [' ', '.', ',', '!', ';'].indexOf(char) !== -1;

const getCompletedWord = (block, offset) => {
    const text = block.getText();
    const textToOffset = text.substr(0, offset);
    const spaceOffset = textToOffset.lastIndexOf(' ');
    return spaceOffset === -1 ? textToOffset : textToOffset.substr(spaceOffset + 1);
};

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty()
        };

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
            [':('] : ':)'
        };

        this.onChange = (editorState) => this.setState({ editorState });

        this.handleBeforeInput = this.handleBeforeInput.bind(this);
    }

    handleBeforeInput(char) {
        if (!isWordEndingChar(char)) {
            return false;
        }

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
                }),
            );
            this.onChange(stateWithCorrectFocus);
            return true;
        }
        return false;
    }

    render() {
        const appWrapperStyle = {
            width: 800,
            margin: '20px auto',
        };
        const editorWrapperStyle = {
            width: 600,
            height: 400,
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
                    />
                </div>
            </div>
        );
    }
}
