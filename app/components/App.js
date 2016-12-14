// @flow

import React from 'react';
import { Editor, EditorState, ContentState, Modifier, createDecorator } from 'draft-js';
import Immutable from 'immutable';

require('draft-js/dist/Draft.css');

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
        };

        this.onChange = (editorState) => this.setState({ editorState });

        this.onClick = this.onClick.bind(this);
        this.handleBeforeInput = this.handleBeforeInput.bind(this);
    }

    onClick() {
        const { editorState } = this.state;
        const currentContent = editorState.getCurrentContent();
        const blocks = currentContent.getBlocksAsArray();
        const newBlocks = blocks.map(block => {
            const curText = block.getText();
            const words = curText.split(' ');
            const replacedWords = words.map(word => {
                return this.substituteWords.hasOwnProperty(word) ? this.substituteWords[word] : word
            });
            const replacedText = replacedWords.join(' ');
            return block.set('text', replacedText);
        });

        const newContentState = ContentState.createFromBlockArray(newBlocks);

        this.onChange(EditorState.createWithContent(newContentState));
    }

    handleBeforeInput(str) {
        // @todo handle punctuation
        const endChars = [' ', '.', ',', '!', ';'];
        if (endChars.indexOf(str) === -1) {
            return false;
        }
        const { editorState } = this.state;
        const selectionState = editorState.getSelection();
        const key = selectionState.getStartKey();
        const currentContentState = editorState.getCurrentContent();
        const currentBlock = currentContentState.getBlockForKey(selectionState.getStartKey());
        const currentBlockMap = currentContentState.getBlockMap();
        const offset = selectionState.focusOffset;
        const text = currentBlock.getText();
        const textToOffset = text.substr(0, offset);
        const spaceOffset = textToOffset.lastIndexOf(' ');
        const word = spaceOffset === -1 ? textToOffset : textToOffset.substr(spaceOffset + 1);

        if (this.substituteWords.hasOwnProperty(word)) {
            const replacementText = text.substr(0, spaceOffset) + ' ' + this.substituteWords[word] + ' ' + text.substr(offset);
            console.log(replacementText);
            const newBlock = currentBlock.merge({
                text: replacementText,
            });
            const newContentState = currentContentState.merge({
                blockMap: currentBlockMap.set(key, newBlock),
            });

            const newState = EditorState.push(editorState, newContentState, 'change-block-data');
            // const newState = EditorState.createWithContent(newContentState);
            // const newStateWithSelection = EditorState.forceSelection(
            //     newState,
            //     selectionState.merge({
            //         focusOffset: selectionState.focusOffset + 10,
            //     })
            // );
            console.dir(newState.toJS());

            this.onChange(newState);
            this.forceUpdate();
            return true;
        }
        return false;
    }

    render() {
        const buttonStyle = {
            padding: 15,
            margin: '15px auto',
            border: '2px solid black',
        };

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
                <h1>Whimsical Editor</h1>
                <button onClick={this.onClick} style={buttonStyle}>Make it whimsical!</button>
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
