import React from 'react';
import {
    EditorState,
    ContentState,
    SelectionState,
    Modifier,
} from 'draft-js';
import Editor from 'draft-js-plugins-editor';
import createInlineToolbarPlugin from 'draft-js-inline-toolbar-plugin'; // eslint-disable-line import/no-unresolved
import 'draft-js/dist/Draft.css';
import 'draft-js-inline-toolbar-plugin/lib/plugin.css'; // eslint-disable-line import/no-unresolved

import createMoraleBoosterPlugin from '../plugins/MoraleBooster';
import createStopDoingThatPlugin from '../plugins/StopDoingThat';

const moraleBoosterPlugin = createMoraleBoosterPlugin();
const stopDoingThatPlugin = createStopDoingThatPlugin();

const inlineToolbarPlugin = createInlineToolbarPlugin();
const { InlineToolbar } = inlineToolbarPlugin;

export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty()
        };

        this.onChange = (editorState) => this.setState({ editorState });
    }

    render() {
        const appWrapperStyle = {
            width: 600,
            margin: '20px auto',
        };
        const editorWrapperStyle = {
            width: 600,
            minHeight: 500,
            border: '1px solid gray',
            fontSize: 24,
            color: '#444',
        };

        return (
            <div style={appWrapperStyle}>
                <h1>Mega-happy text editor v0.1</h1>
                <div style={editorWrapperStyle}>
                    <Editor
                        editorState={this.state.editorState}
                        onChange={this.onChange}
                        plugins={[
                            inlineToolbarPlugin,
                            moraleBoosterPlugin,
                            stopDoingThatPlugin,
                        ]}
                    />
                </div>
                <InlineToolbar/>
            </div>
        );
    }
}
