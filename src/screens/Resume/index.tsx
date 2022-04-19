import React, { useEffect, useState, useCallback } from "react";
import { ActivityIndicator } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VictoryPie } from 'victory-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from "styled-components";
import { useAuth } from "../../hooks/auth";

import { categories } from "../../utils/categories";
import { HistoryCard } from "../../components/HistoryCard";

import {
  Container,
  Header,
  Title,
  Content,
  ChartContainer,
  MonthSelect,
  MonthSelectButton,
  MonthSelectIcon,
  Month,
  LoadContainer,
} from './styles';


interface ITransactionData {
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;

}
interface ICategoryData {
  key: string;
  name: string;
  totalFormatted: string;
  total: number;
  color: string;
  percent: string;
}

export function Resume() {

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelecteDate] = useState(new Date);
  const [totalByCategories, setTotalByCategories] = useState<ICategoryData[]>([]);

  const theme = useTheme();
  const { user } = useAuth();

  function handleDateChane(action: 'next' | 'prev') {

    if (action == 'next') {
      setSelecteDate(addMonths(selectedDate, 1));
    } else {
      setSelecteDate(subMonths(selectedDate, 1));
    }
  }

  async function loadData() {
    setIsLoading(true);
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const responseFormatted = response ? JSON.parse(response) : [];

    const expensives = responseFormatted
      .filter((expensive: ITransactionData) =>
        expensive.type === 'negative' &&
        new Date(expensive.date).getMonth() === selectedDate.getMonth() &&
        new Date(expensive.date).getFullYear() === selectedDate.getFullYear()
      );

    const expensivesTotal = expensives
      .reduce((acumullator: number, expensive: ITransactionData) => {
        return acumullator + Number(expensive.amount);
      }, 0);

    const totalByCategory: ICategoryData[] = [];
    categories.forEach(category => {
      let categorySum = 0;

      expensives.forEach((expensive: ITransactionData) => {
        if (expensive.category === category.key) {
          categorySum = categorySum + Number(expensive.amount);
        }
      });

      if (categorySum > 0) {
        const totalFormat = Intl.NumberFormat('pt-BR',
          { style: 'currency', currency: 'BRL' }).format(categorySum);

        const percent = `${(categorySum / expensivesTotal * 100).toFixed(0)}%`;

        totalByCategory.push({
          key: category.key,
          name: category.name,
          color: category.color,
          total: categorySum,
          totalFormatted: totalFormat,
          percent
        });

      }
    });

    setTotalByCategories(totalByCategory);
    setIsLoading(false);
  }

  useFocusEffect(useCallback(() => {
    loadData();
  }, [selectedDate]));
  return (
    <Container>

      <Header>
        <Title>Resumo por categoria</Title>
      </Header>
      {
        isLoading ?
          <LoadContainer>
            <ActivityIndicator
              color={theme.colors.primary}
            />
          </LoadContainer> :
          <Content
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: useBottomTabBarHeight(),
            }}
          >
            <MonthSelect>
              <MonthSelectButton onPress={() => handleDateChane('prev')}>
                <MonthSelectIcon name='chevron-left' />
              </MonthSelectButton>

              <Month>{format(selectedDate, 'MMMM, yyyy', { locale: ptBR })}</Month>

              <MonthSelectButton onPress={() => handleDateChane('next')} >
                <MonthSelectIcon name='chevron-right' />
              </MonthSelectButton>
            </MonthSelect>
            <ChartContainer>
              <VictoryPie
                data={totalByCategories}
                colorScale={totalByCategories.map(category => category.color)}
                style={{
                  labels: {
                    fontSize: RFValue(18),
                    fontFamily: 'bold',
                    fill: theme.colors.shape
                  }
                }}
                labelRadius={50}
                x='percent'
                y='total'
              />
            </ChartContainer>

            {
              totalByCategories.map(item => (
                <HistoryCard
                  key={item.key}
                  title={item.name}
                  amount={item.totalFormatted}
                  color={item.color}
                />
              ))
            }
          </Content>
      }
    </Container>
  )
}