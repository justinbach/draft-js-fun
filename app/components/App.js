// @flow

import React from 'react';
import { Editor, EditorState, ContentState, SelectionState, Modifier, createDecorator } from 'draft-js';

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

    handleBeforeInput(str) {
        const endChars = [' ', '.', ',', '!', ';'];
        if (endChars.indexOf(str) === -1) {
            return false;
        }
        const { editorState } = this.state;
        const selectionState = editorState.getSelection();
        const key = selectionState.getStartKey();
        const currentContentState = editorState.getCurrentContent();
        const currentBlock = currentContentState.getBlockForKey(selectionState.getStartKey());
        const offset = selectionState.focusOffset;
        const text = currentBlock.getText();
        const textToOffset = text.substr(0, offset);
        const spaceOffset = textToOffset.lastIndexOf(' ');
        const word = spaceOffset === -1 ? textToOffset : textToOffset.substr(spaceOffset + 1);

        if (this.substituteWords.hasOwnProperty(word)) {
            const newContentState = Modifier.replaceText(
                editorState.getCurrentContent(),
                new SelectionState({
                    anchorKey: key,
                    anchorOffset: spaceOffset + 1,
                    focusKey: key,
                    focusOffset: offset,
                }),
                this.substituteWords[word] + str
            );

            const newState = EditorState.push(editorState, newContentState, 'replace-text');

            const newStateWithFocus = EditorState.forceSelection(
                newState,
                new SelectionState({
                    anchorKey: currentBlock.getKey(),
                    anchorOffset: spaceOffset + 2 + this.substituteWords[word].length,
                    focusKey: currentBlock.getKey(),
                    focusOffset: spaceOffset + 2 + this.substituteWords[word].length,
                }),
            );
            console.dir(newState.toJS());

            this.onChange(newStateWithFocus);
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
