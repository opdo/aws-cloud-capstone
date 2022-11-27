import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Card,
  Select
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'
import { PopupEditTodo } from './PopupEditTodo'

const limitOptions = [
  { key: '3', value: 3, text: '3 items per page' },
  { key: '6', value: 6, text: '6 items per page' },
  { key: '12', value: 12, text: '12 items per page' },
  { key: '24', value: 24, text: '24 items per page' },
]

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  openEditPopup: boolean
  editItem: Todo
  nextKey: string
  limit: number
  nextKeyList: string[],
  currentKey: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    openEditPopup: false,
    editItem: {} as Todo,
    nextKey: '',
    limit: 6,
    nextKeyList: [],
    currentKey: ''
  }

  setLimit(limit: number) {
    this.setState({ nextKeyList: [], limit, nextKey: '' })
    this.getTodos(limit, '')
  }

  setOpenEditPopup(openEditPopup: boolean) {
    this.setState({ openEditPopup })
  }

  onClickNextButton() {
    console.log("Next button", this.state.nextKeyList)
    var nextKeyList = this.state.nextKeyList;
    nextKeyList.push(this.state.currentKey);
    this.setState({ nextKeyList })

    this.getTodos(this.state.limit, this.state.nextKey)
  }

  onClickPreButton() {
    var nextKeyList = this.state.nextKeyList;
    var preKey = nextKeyList.pop();
    this.setState({ nextKeyList })

    this.getTodos(this.state.limit, preKey)
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todo: Todo) => {
    console.log("Edit to do,", todo)
    this.setState({ editItem: todo, openEditPopup: true })
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      if (!window.confirm("Do you want to delete this todo?")) return;

      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done,
        uploadImage: false // Default is false
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    this.getTodos()
  }

  async getTodos(limit?: number, nextKey?: string) {
    try {
      if (limit === undefined || limit === null) {
        limit = this.state.limit
      }
      if (nextKey === undefined || nextKey === null) {
        nextKey = this.state.nextKey
      }

      this.setState({
        loadingTodos: true,
        currentKey: nextKey
      })

      const result = await getTodos(this.props.auth.getIdToken(), limit, nextKey)

      this.setState({
        todos: result.items,
        nextKey: result.nextKey ?? '',
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }



  render() {
    return (
      <div>
        <Header as="h1">Vinh's TODOs</Header>

        {this.renderCreateTodoInput()}

        <div style={{ paddingBottom: '15px', textAlign: 'right' }}>
          <Select placeholder='Page size' style={{ marginRight: '10px' }} options={limitOptions} value={this.state.limit} onChange={(e, data) => this.setLimit(Number(data.value))} />
          <Button primary
            content='Previous'
            icon='left arrow'
            labelPosition='left'
            onClick={() => this.onClickPreButton()}
            disabled={(this.state.nextKeyList.length === 0)} />
          <Button primary
            content='Next'
            icon='right arrow'
            labelPosition='right'
            onClick={() => this.onClickNextButton()}
            disabled={(this.state.nextKey === null || this.state.nextKey === '')} />
        </div>
        {this.renderTodos()}

        {this.state.openEditPopup && <PopupEditTodo
          display={this.state.openEditPopup}
          closeFunction={() => { this.setOpenEditPopup(false); this.setState({ loadingTodos: true }); this.getTodos(); }}
          item={this.state.editItem}
          auth={this.props.auth} />}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            placeholder="To change the world..."
            value={this.state.newTodoName}
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid doubling stretched columns={3}>

        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Column key={pos}>
              <Card fluid>
                {todo.attachmentUrl && (
                  <Image src={todo.attachmentUrl} fluid />
                )}
                <Card.Content>
                  <Card.Description>
                    {todo.name}
                  </Card.Description>
                  <Card.Meta>
                    <span className='date'>Due date: {todo.dueDate}</span>
                  </Card.Meta>
                </Card.Content>
                <Card.Content extra>

                  <Grid columns='equal'>
                    <Grid.Column>
                      <Checkbox label='Mark done'
                        onChange={() => this.onTodoCheck(pos)}
                        checked={todo.done} />
                    </Grid.Column>
                    <Grid.Column width={8}>
                      <Button.Group floated="right" size='mini'>
                        <Button
                          icon
                          color="blue"
                          onClick={() => this.onEditButtonClick(todo)}
                        >
                          <Icon name="pencil" />
                        </Button>
                        <Button
                          icon
                          color="red"
                          onClick={() => this.onTodoDelete(todo.todoId)}
                        >
                          <Icon name="delete" />
                        </Button>
                      </Button.Group>
                    </Grid.Column>
                  </Grid>
                </Card.Content>
              </Card>
            </Grid.Column>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
