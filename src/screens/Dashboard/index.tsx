import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import 'intl';
import 'intl/locale-data/jsonp/pt-BR';

import { useFocusEffect } from "@react-navigation/native";

import { useTheme} from 'styled-components';

import { useAuth } from "../../hooks/auth";
import { HighlightCard } from "../../components/HighlightCard";
import { TransactionCard, ITransactionCardProps } from "../../components/TransactionCard";

import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer,
} from './styles';


export interface IDataListProps extends ITransactionCardProps {
  id: string
}
interface HighlightProps {
  amount: string;
  lastTransaction: string;
}
interface HighlightData {
  entries: HighlightProps;
  expensives: HighlightProps;
  total: HighlightProps;
}

export function Dashboard() {
  const [isLoading, setIsloading] = useState(true);
  const [transactions, setTransactions] = useState<IDataListProps[]>([])
  const [highlightData, sethighlightData] = useState<HighlightData>({} as HighlightData);

  const { signOut, user } = useAuth();

  const theme = useTheme();

  function getLastTransactionDate(
    collection: IDataListProps[],
    type: 'positive' | 'negative'
  ) {
    const collectionFilttered = collection.filter((transact: IDataListProps) => transact.type === type);

    if(collectionFilttered.length === 0) return 0;

    const lastTransaction = new Date (
      Math.max.apply(Math, collectionFilttered
      .map((transact: IDataListProps) => new Date(transact.date).getTime())));

     return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleDateString('pt-BR', {month: 'long'})}`;
  };

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transaction = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: IDataListProps[] = transaction
      .map((item: IDataListProps) => {

        if (item.type === 'positive') {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });

        const date = Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount,
          type: item.type,
          category: item.category,
          date,
        }
      });
    setTransactions(transactionsFormatted);

    const lastTransactionEntries = getLastTransactionDate(transaction, 'positive');
    const lastTransactionExpensives = getLastTransactionDate(transaction, 'negative');

    const totalIterval = lastTransactionEntries === 0
    ? 'não há transações'
    : `01 a ${lastTransactionEntries}`;
    const total = entriesTotal - expensiveTotal;
    const entriesTotalFormat = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(entriesTotal)

    const expensiveTotalFormat = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(expensiveTotal)
    let totalFormat = Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(total)

    sethighlightData({
      entries: {
        amount: entriesTotalFormat,
        lastTransaction: lastTransactionEntries === 0
        ? 'Não há transações'
        : `Última entrada dia ${lastTransactionEntries}`,
      },
      expensives: {
        amount: expensiveTotalFormat,
        lastTransaction: lastTransactionExpensives === 0
        ? 'Não há transações'
        :`Última saída dia ${lastTransactionExpensives}`
      },
      total: {
        amount: totalFormat,
        lastTransaction: totalIterval,
      }
    });
    setIsloading(false);
  }

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, []));

  return (
    <Container>

      {
        isLoading ?
        <LoadContainer>
          <ActivityIndicator
            color={theme.colors.primary}
            size= 'large'
          />
        </LoadContainer> :
        <>
          <Header >
            <UserWrapper>
              <UserInfo>
                <Photo
                  source={{ uri: user.photo }}
                />
                <User>
                  <UserGreeting>Olá, </UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>
          <HighlightCards>
            <HighlightCard
              type="up"
              title="Entrada"
              amount={highlightData.entries.amount}
              lastTransaction={highlightData.entries.lastTransaction}
            />
            <HighlightCard
              type="down"
              title="Saídas"
              amount={highlightData.expensives.amount}
              lastTransaction={highlightData.expensives.lastTransaction}
            />
            <HighlightCard
              type="total"
              title="Total"
              amount={highlightData.total.amount}
              lastTransaction={highlightData.total.lastTransaction}
            />
          </HighlightCards>
          <Transactions>
            <Title>Listagem</Title>
            <TransactionList
              data={transactions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />

          </Transactions>
        </>
      }
    </Container>
  )
}