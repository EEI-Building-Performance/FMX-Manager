import React from 'react';
import { cx } from '@/utils/cx';
import { Button } from './Button';
import { EditIcon, DeleteIcon } from '@/components/icons/Icon';
import cls from './DataTable.module.css';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAdd?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
  title?: string;
  className?: string;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false,
  emptyMessage = 'No data available',
  title,
  className
}: DataTableProps<T>) {
  const getValue = (item: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      // Handle nested properties like 'building.name'
      return key.split('.').reduce((obj, prop) => obj?.[prop], item as any);
    }
    return item[key as keyof T];
  };

  return (
    <div className={cx(cls.container, className)}>
      {(title || onAdd) && (
        <div className={cls.header}>
          {title && <h2 className={cls.title}>{title}</h2>}
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              Add New
            </Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className={cls.loading}>
          <span>Loading...</span>
        </div>
      ) : data.length === 0 ? (
        <div className={cls.empty}>
          <p>{emptyMessage}</p>
          {onAdd && (
            <Button onClick={onAdd} variant="secondary" size="sm">
              Add First Item
            </Button>
          )}
        </div>
      ) : (
        <div className={cls.tableWrapper}>
          <table className={cls.table}>
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th 
                    key={String(column.key) + index}
                    className={cx(cls.th, column.className)}
                  >
                    {column.header}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className={cls.actions}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className={cls.tr}>
                  {columns.map((column, index) => (
                    <td 
                      key={String(column.key) + index}
                      className={cx(cls.td, column.className)}
                    >
                      {column.render 
                        ? column.render(item)
                        : String(getValue(item, column.key) ?? '')
                      }
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className={cls.actions}>
                      <div className={cls.actionButtons}>
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className={cls.iconButton}
                            title="Edit"
                          >
                            <EditIcon size={16} />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(item)}
                            className={cls.iconButton}
                            title="Delete"
                          >
                            <DeleteIcon size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
