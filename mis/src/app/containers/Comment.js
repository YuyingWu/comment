import React from "react";
import {connect} from "react-redux";
import { initList, selectComment, updateDisplayList, delComment, updateComment } from "../actions/commentAction";

class Comment extends React.Component {
	constructor(props) {
		super(props);
		
		this.onCheck = this.onCheck.bind(this);
	}
	onCheck(e) {
		const input = e.target;
		const id = input.value;
		let currentDeal = [...this.props.selected];

		if(input.checked){
			currentDeal = [...currentDeal, id];
		}else{
			currentDeal = currentDeal.filter(val => val !== id);
		}

		this.props.selectComment(currentDeal);
	}
	statusFilter(type) {
		console.log(type);
		switch(type) {
			case 'spam':
				this.props.updateDisplayList(this.props.originList.filter(item => item.isSpam));
				break;
			case 'normal':
				this.props.updateDisplayList(this.props.originList.filter(item => !item.isSpam));
				break;
			default:
				this.props.updateDisplayList(this.props.originList);
		}
	}
	updateStatus(id, type) {
		const db = this.props.originList;

		switch(type) {
			case 'isSpam':
				this.props.updateComment(id, 'isSpam', true);
				break;
			case 'notSpam':
				this.props.updateComment(id, 'isSpam', false);
				break;
		}
	}
	render() {
		return (
			<section>
				<header>
					<ul className="nav nav-pills">
						<li>
							<a href="#" 
								onClick={ () => { this.statusFilter(); }}>全部</a>
						</li>
						<li>
							<a href="#" 
								onClick={ () => { this.statusFilter('spam'); }}>垃圾评论</a>
						</li>
						<li>
							<a href="#" 
								onClick={ () => { this.statusFilter('normal'); }}>正常评论</a>
						</li>
				     </ul>
				</header>
				<table className="table table-striped">
					<thead>
						<tr>
							<td>-</td>
							<td>author</td>
							<td>comment</td>
							<td>status</td>
							<td>actions</td>
						</tr>
					</thead>
					<tbody>
						{ this.props.displayList
							// .filter(item => !item.isSpam)
							.map(item => (
							<tr key={ 'comment-id-' + item.id }>
								<td>
									<input type="checkbox" 
										onChange={ this.onCheck }
										value={ item.id }
										/>
								</td>
								<td>{ item.author }</td>
								<td dangerouslySetInnerHTML={{__html: item.content}}></td>
								<td>{ item.isSpam ? '垃圾' : '通过' }</td>
								<td>
									{ item.isSpam 
										?  <span className="btn btn-xs btn-success" 
										onClick={ ()=>{ this.updateStatus(item.id, 'notSpam'); } }>这是好的</span>
										: <span className="btn btn-xs btn-danger" 
										onClick={ ()=>{ this.updateStatus(item.id, 'isSpam'); } }>这是垃圾</span>
									}
									<span className="btn btn-xs btn-primary" 
									onClick={ () => {
										this.props.delComment(item.id);
									} }>删除</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		);
	}
	componentDidMount() {
		this.props.initList();
	}
}

const mapStateToProps = (state) => {
	return {
		displayList: state.comment.displayList,
		selected: state.comment.selected,
		originList: state.comment.list
	};
};

const mapDispatchToProps = (dispatch) => {
    return {
    	initList: () => {
            dispatch(initList());
        },
        selectComment: (data) => {
            dispatch(selectComment(data));
        },
        updateDisplayList: (data) => {
        	dispatch(updateDisplayList(data));
        },
        delComment: id => {
        	dispatch(delComment(id));
        },
        updateComment: (id, key, value) => {
        	dispatch(updateComment(id, key, value));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Comment);