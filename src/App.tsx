import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import * as todoServise from './api/todos';
import cn from 'classnames';

import { Todo } from './types/Todo';
import { TodoList } from './component/TodoList/TodoList';
import { Headers } from './component/Headers/Headers';
import { Footer } from './component/Footer/Footer';
import { timerClierErrorMessege } from './utils/fetchClient';
import { ErrorType } from './types/errorType';

function filteredTodos(todos: Todo[], completed?: boolean) {
  let newTodosList = [...todos];

  if (completed !== undefined) {
    newTodosList = newTodosList.filter(todo => todo.completed === completed);
  }

  return newTodosList;
}

export const App: React.FC = () => {
  const [todoList, setTodoList] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stateTodo, setStateTodo] = useState<boolean | undefined>();
  const [serverLoading, setServerLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState<Todo | null>(null);
  const [todoDelete, setTodoDelete] = useState<boolean>(false);

  const todoCompleteList = filteredTodos(todoList, stateTodo);

  const completedAll = todoList.every(todo => todo.completed);
  const hasCompletedTodo = todoCompleteList.some(todo => todo.completed);
  const itemLeft = todoList.filter(todo => todo.completed === false).length;

  useEffect(() => {
    todoServise
      .getTodos()
      .then(setTodoList)
      .catch(error => {
        setErrorMessage(ErrorType.Load);
        throw error;
      })
      .finally(() => timerClierErrorMessege(setErrorMessage));
  }, []);

  if (!todoServise.USER_ID) {
    return <UserWarning />;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (title.trim().length === 0) {
      setErrorMessage(ErrorType.Title);
      timerClierErrorMessege(setErrorMessage);

      return;
    }

    setServerLoading(true);

    setLoadingItem({
      id: 0,
      userId: todoServise.USER_ID,
      title: title,
      completed: false,
    });

    todoServise
      .addTodos(title.trim())
      .then(todo => {
        setTodoList(currentList => [...currentList, todo]);
        setLoadingItem(null);
        setTitle('');
      })
      .catch(eroor => {
        setErrorMessage(ErrorType.Add);
        throw eroor;
      })
      .finally(() => {
        timerClierErrorMessege(setErrorMessage);
        setServerLoading(false);
      });
  };

  const deleteTodo = (todoId: number) => {
    setTodoDelete(true);

    return todoServise
      .deleteTodos(todoId)
      .then(() => {
        setTodoList(currentTodoList =>
          currentTodoList.filter(todo => todo.id !== todoId),
        );
      })
      .catch(error => {
        setTodoList(currentList => [...currentList]);
        setErrorMessage(ErrorType.Delete);
        throw error;
      })
      .finally(() => setTodoDelete(false));
  };

  const handleCompletedAll = () => {
    setTodoList(currentTodo =>
      currentTodo.map(todo => ({
        ...todo,
        completed: !completedAll,
      })),
    );

    todoList.map(todo =>
      todoServise.patchTodos(todo.id, { completed: !completedAll }),
    );
  };

  const handleCompleted = (todoId: number) => {
    setTodoList(currentTodo =>
      currentTodo.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
      ),
    );

    const todoUpdete = todoList.find(todo => todo.id === todoId);

    if (todoUpdete) {
      return todoServise.patchTodos(todoId, {
        completed: !todoUpdete.completed,
      });
    }
  };

  const clearComplete = async () => {
    const completedTodos = todoList.filter(todo => todo.completed);

    for (const todo of completedTodos) {
      try {
        await todoServise.deleteTodos(todo.id);
        setTodoList(currentList => currentList.filter(t => t.id !== todo.id));
      } catch (error) {
        setErrorMessage(ErrorType.Delete);
      }
    }
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Headers
          todoCompleteList={todoCompleteList}
          handleCompletedAll={handleCompletedAll}
          completedAll={completedAll}
          handleSubmit={handleSubmit}
          title={title}
          setTitle={value => setTitle(value)}
          serverLoading={serverLoading}
        />

        {todoList.length > 0 && (
          <>
            <TodoList
              deleteTodos={deleteTodo}
              completed={handleCompleted}
              todoDelete={todoDelete}
              todoList={todoCompleteList}
              loading={serverLoading}
              tempTodo={loadingItem}
            />

            <Footer
              itemLeft={itemLeft}
              stateTodo={stateTodo}
              setStateTodo={state => setStateTodo(state)}
              clearComplete={clearComplete}
              hasCompletedTodo={hasCompletedTodo}
            />
          </>
        )}
      </div>
      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          {
            hidden: !errorMessage,
          },
        )}
      >
        <button data-cy="HideErrorButton" type="button" className="delete" />
        {errorMessage}
      </div>
    </div>
  );
};
