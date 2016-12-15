import React from 'react';

export default class ImageBlock extends React.Component {
    render() {
        const data = this.props.block.getData();
        // const url = data.get('url');
        const url = 'http://dev-jbachorik.npr.org/npr.jpg';
        return (
            <div className='image-wrap'>
                <img src={url} />
            </div>
        );
    }
}