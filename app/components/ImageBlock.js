import React from 'react';

export default class ImageBlock extends React.Component {
    render() {
        const data = this.props.block.getData();
        // const url = data.get('url');
        const url = 'http://lightskinnededgirl.typepad.com/.a/6a00d8341c5e8f53ef014e8928cb17970d-800wi';
        return (
            <div className='image-wrap'>
                <img src={url} />
            </div>
        );
    }
}